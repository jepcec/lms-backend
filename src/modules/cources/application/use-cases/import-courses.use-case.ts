import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCourseUseCase } from './create-course.use-case';
import { CreateModuleUseCase } from './create-module.use-case';
import { CreateSessionUseCase } from './create-session.use-case';
import { CreateMaterialUseCase } from './create-material.use-case';

const LEVELS = ['principiante', 'intermedio', 'avanzado'];
const STATUSES = ['draft', 'published', 'archived'];
const MATERIAL_TYPES = ['PDF', 'Excel', 'Word', 'Otro', 'Video'];

export interface ImportMaterialInput {
  name: string;
  drive_url: string;
  type: string;
}

export interface ImportSessionInput {
  title: string;
  description?: string;
  youtube_url: string;
  duration_minutes: number;
  display_order?: number;
  materials: ImportMaterialInput[];
}

export interface ImportModuleInput {
  title: string;
  description?: string;
  display_order?: number;
  sessions: ImportSessionInput[];
}

export interface ImportInstructorInput {
  full_name: string;
  title: string;
  description?: string;
  photo_url?: string;
  display_order?: number;
}

export interface ImportCourseInput {
  label: string; // identificador legible para reportar errores (título o "fila N")
  category_slug: string;
  title: string;
  slug?: string;
  tagline: string;
  description: string;
  level: string;
  software_tools: string[];
  price_pen: number;
  discount_price_pen?: number | null;
  price_usd: number;
  discount_price_usd?: number | null;
  access_duration_months: number;
  prerequisites: string[];
  outcomes: string[];
  status: string;
  academic_hours?: number;
  instructors: ImportInstructorInput[];
  modules: ImportModuleInput[];
}

export interface ImportedCourseResult {
  title: string;
  id: string;
  modules_count: number;
  sessions_count: number;
  materials_count: number;
}

export interface FailedCourseResult {
  title: string;
  errors: string[];
}

@Injectable()
export class ImportCoursesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createCourse: CreateCourseUseCase,
    private readonly createModule: CreateModuleUseCase,
    private readonly createSession: CreateSessionUseCase,
    private readonly createMaterial: CreateMaterialUseCase,
  ) {}

  async execute(courses: ImportCourseInput[], createdBy: string) {
    const categories = await this.prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const existingCourses = await this.prisma.course.findMany({
      where: { deleted_at: null },
      select: { slug: true },
    });
    const usedSlugs = new Set(existingCourses.map((c) => c.slug));

    const imported: ImportedCourseResult[] = [];
    const failed: FailedCourseResult[] = [];

    for (const input of courses) {
      const errors = this.validateCourse(input, categoryBySlug, usedSlugs);

      if (errors.length > 0) {
        failed.push({ title: input.label, errors });
        continue;
      }

      const slug = input.slug?.trim() || undefined;
      if (slug) usedSlugs.add(slug);

      try {
        const result = await this.createCourseTree(
          input,
          categoryBySlug.get(input.category_slug)!,
          createdBy,
        );
        imported.push(result);
      } catch (error: any) {
        failed.push({
          title: input.label,
          errors: [
            `Error al crear el curso: ${error?.message ?? 'error desconocido'}. ` +
              'Puede haber quedado parcialmente creado — revísalo o elimínalo desde el panel antes de reintentar.',
          ],
        });
      }
    }

    return { imported, failed };
  }

  private validateCourse(
    input: ImportCourseInput,
    categoryBySlug: Map<string, string>,
    usedSlugs: Set<string>,
  ): string[] {
    const errors: string[] = [];

    if (!input.title?.trim()) errors.push('title es obligatorio');
    if (!input.tagline?.trim()) errors.push('tagline es obligatorio');
    if (!input.description?.trim()) errors.push('description es obligatorio');
    if (!categoryBySlug.has(input.category_slug)) {
      errors.push(`category_slug '${input.category_slug}' no existe`);
    }
    if (!LEVELS.includes(input.level)) {
      errors.push(`level '${input.level}' inválido (usa: ${LEVELS.join(', ')})`);
    }
    if (!STATUSES.includes(input.status)) {
      errors.push(`status '${input.status}' inválido (usa: ${STATUSES.join(', ')})`);
    }
    if (!Number.isFinite(input.price_pen) || input.price_pen < 0) {
      errors.push('price_pen debe ser un número >= 0');
    }
    if (!Number.isFinite(input.price_usd) || input.price_usd < 0) {
      errors.push('price_usd debe ser un número >= 0');
    }
    if (
      !Number.isFinite(input.access_duration_months) ||
      input.access_duration_months <= 0
    ) {
      errors.push('access_duration_months debe ser un entero > 0');
    }

    const slug = input.slug?.trim();
    if (slug && usedSlugs.has(slug)) {
      errors.push(`slug '${slug}' ya existe (en la BD o repetido en este mismo archivo)`);
    }

    for (const inst of input.instructors) {
      if (!inst.full_name?.trim() || !inst.title?.trim()) {
        errors.push(
          `Instructor inválido: full_name y title son obligatorios (recibido: "${inst.full_name ?? ''}")`,
        );
      }
    }

    if (input.modules.length === 0) {
      errors.push('El curso no tiene ningún módulo');
    }

    for (const mod of input.modules) {
      if (!mod.title?.trim()) {
        errors.push('Un módulo no tiene title');
        continue;
      }
      if (mod.sessions.length === 0) {
        errors.push(`Módulo "${mod.title}": no tiene ninguna sesión`);
      }
      for (const ses of mod.sessions) {
        const sesLabel = ses.title || '(sin título)';
        if (!ses.title?.trim()) {
          errors.push(`Módulo "${mod.title}": una sesión no tiene title`);
        }
        if (!ses.youtube_url?.trim()) {
          errors.push(`Sesión "${sesLabel}": youtube_url es obligatorio`);
        }
        if (
          !Number.isFinite(ses.duration_minutes) ||
          ses.duration_minutes <= 0
        ) {
          errors.push(
            `Sesión "${sesLabel}": duration_minutes debe ser un entero > 0`,
          );
        }
        for (const mat of ses.materials) {
          if (!mat.name?.trim() || !mat.drive_url?.trim()) {
            errors.push(
              `Sesión "${sesLabel}": un material no tiene name o drive_url`,
            );
          }
          if (!MATERIAL_TYPES.includes(mat.type)) {
            errors.push(
              `Sesión "${sesLabel}": tipo de material '${mat.type}' inválido (usa: ${MATERIAL_TYPES.join(', ')})`,
            );
          }
        }
      }
    }

    return errors;
  }

  private async createCourseTree(
    input: ImportCourseInput,
    categoryId: string,
    createdBy: string,
  ): Promise<ImportedCourseResult> {
    const courseResult = await this.createCourse.execute(
      {
        category_id: categoryId,
        title: input.title,
        slug: input.slug?.trim() || undefined,
        tagline: input.tagline,
        description: input.description,
        level: input.level as any,
        software_tools: input.software_tools,
        price_pen: input.price_pen,
        discount_price_pen: input.discount_price_pen ?? undefined,
        price_usd: input.price_usd,
        discount_price_usd: input.discount_price_usd ?? undefined,
        access_duration_months: input.access_duration_months,
        prerequisites: input.prerequisites,
        outcomes: input.outcomes,
        status: input.status as any,
        academic_hours: input.academic_hours,
        instructors: input.instructors,
      },
      createdBy,
    );

    let sessionsCount = 0;
    let materialsCount = 0;

    for (const mod of input.modules) {
      const moduleResult = await this.createModule.execute({
        course_id: courseResult.course.id,
        title: mod.title,
        description: mod.description,
        display_order: mod.display_order,
      });

      for (const ses of mod.sessions) {
        const sessionResult = await this.createSession.execute({
          module_id: moduleResult.module.id,
          title: ses.title,
          description: ses.description,
          youtube_url: ses.youtube_url,
          duration_minutes: ses.duration_minutes,
          display_order: ses.display_order,
        });
        sessionsCount++;

        for (const mat of ses.materials) {
          await this.createMaterial.execute({
            session_id: sessionResult.session.id,
            name: mat.name,
            drive_url: mat.drive_url,
            type: mat.type as any,
          });
          materialsCount++;
        }
      }
    }

    return {
      title: courseResult.course.title,
      id: courseResult.course.id,
      modules_count: input.modules.length,
      sessions_count: sessionsCount,
      materials_count: materialsCount,
    };
  }
}

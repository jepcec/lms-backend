import { Injectable, BadRequestException } from '@nestjs/common';
import { ImportCoursesUseCase, ImportCourseInput } from './import-courses.use-case';

@Injectable()
export class ImportCoursesJsonUseCase {
  constructor(private readonly importCourses: ImportCoursesUseCase) {}

  async execute(body: any, createdBy: string) {
    if (!Array.isArray(body)) {
      throw new BadRequestException(
        'El body debe ser un array de cursos. Usa la plantilla exportada en JSON.',
      );
    }

    const courses: ImportCourseInput[] = body.map((c: any, idx: number) => ({
      label: c?.title || `elemento ${idx + 1} del array`,
      category_slug: c?.category_slug ?? '',
      title: c?.title ?? '',
      slug: c?.slug || undefined,
      tagline: c?.tagline ?? '',
      description: c?.description ?? '',
      level: c?.level ?? '',
      software_tools: Array.isArray(c?.software_tools) ? c.software_tools : [],
      price_pen: Number(c?.price_pen),
      discount_price_pen:
        c?.discount_price_pen !== undefined ? c.discount_price_pen : null,
      price_usd: Number(c?.price_usd),
      discount_price_usd:
        c?.discount_price_usd !== undefined ? c.discount_price_usd : null,
      access_duration_months: Number(c?.access_duration_months),
      prerequisites: Array.isArray(c?.prerequisites) ? c.prerequisites : [],
      outcomes: Array.isArray(c?.outcomes) ? c.outcomes : [],
      status: c?.status ?? '',
      academic_hours: c?.academic_hours,
      instructors: Array.isArray(c?.instructors) ? c.instructors : [],
      modules: (Array.isArray(c?.modules) ? c.modules : []).map((m: any) => ({
        title: m?.title ?? '',
        description: m?.description,
        display_order: m?.display_order,
        sessions: (Array.isArray(m?.sessions) ? m.sessions : []).map(
          (s: any) => ({
            title: s?.title ?? '',
            description: s?.description,
            video_provider: s?.video_provider ?? undefined,
            youtube_url: s?.youtube_url ?? undefined,
            drive_url: s?.drive_url ?? undefined,
            duration_minutes: Number(s?.duration_minutes),
            display_order: s?.display_order,
            materials: (Array.isArray(s?.materials) ? s.materials : []).map(
              (mat: any) => ({
                name: mat?.name ?? '',
                drive_url: mat?.drive_url ?? '',
                type: mat?.type ?? '',
              }),
            ),
          }),
        ),
      })),
    }));

    return this.importCourses.execute(courses, createdBy);
  }
}

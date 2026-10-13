import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import * as ExcelJS from 'exceljs';
import type { CursoParams } from '../dtos/curso-params.dto';
import { buildCourseFilterWhere, buildCourseOrderBy } from '../utils/course-filters';

const LIST_SEP = ' | ';

@Injectable()
export class ExportCoursesExcelUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: CursoParams = {}): Promise<Buffer> {
    const courses = await this.prisma.course.findMany({
      where: await buildCourseFilterWhere(this.prisma, params),
      include: {
        category: { select: { slug: true } },
        instructors: { orderBy: { display_order: 'asc' } },
        modules: {
          orderBy: { display_order: 'asc' },
          include: {
            sessions: {
              orderBy: { display_order: 'asc' },
              include: { materials: true },
            },
          },
        },
      },
      orderBy: buildCourseOrderBy(params.sort),
    });

    const workbook = new ExcelJS.Workbook();

    const cursosSheet = workbook.addWorksheet('Cursos');
    const instructoresSheet = workbook.addWorksheet('Instructores');
    const modulosSheet = workbook.addWorksheet('Modulos');
    const sesionesSheet = workbook.addWorksheet('Sesiones');
    const materialesSheet = workbook.addWorksheet('Materiales');

    styleHeader(
      cursosSheet.addRow([
        'curso_id',
        'category_slug',
        'title',
        'slug',
        'tagline',
        'description',
        'level',
        'software_tools',
        'price_pen',
        'discount_price_pen',
        'price_usd',
        'discount_price_usd',
        'access_duration_months',
        'prerequisites',
        'outcomes',
        'status',
        'academic_hours',
      ]),
    );
    styleHeader(
      instructoresSheet.addRow([
        'curso_id',
        'full_name',
        'title',
        'description',
        'photo_url',
        'display_order',
      ]),
    );
    styleHeader(
      modulosSheet.addRow([
        'modulo_id',
        'curso_id',
        'title',
        'description',
        'display_order',
      ]),
    );
    styleHeader(
      sesionesSheet.addRow([
        'sesion_id',
        'modulo_id',
        'title',
        'description',
        'youtube_url',
        'duration_minutes',
        'display_order',
        // Al final para que los archivos anteriores (sin estas columnas) sigan
        // importándose como sesiones de YouTube.
        'video_provider',
        'drive_url',
      ]),
    );
    styleHeader(
      materialesSheet.addRow(['sesion_id', 'name', 'drive_url', 'type']),
    );

    let moduloSeq = 0;
    let sesionSeq = 0;

    courses.forEach((course, idx) => {
      const cursoId = idx + 1;

      cursosSheet.addRow([
        cursoId,
        course.category.slug,
        course.title,
        course.slug,
        course.tagline,
        course.description,
        course.level,
        course.software_tools.join(LIST_SEP),
        Number(course.price_pen),
        course.discount_price_pen !== null
          ? Number(course.discount_price_pen)
          : '',
        Number(course.price_usd),
        course.discount_price_usd !== null
          ? Number(course.discount_price_usd)
          : '',
        course.access_duration_months,
        course.prerequisites.join(LIST_SEP),
        course.outcomes.join(LIST_SEP),
        course.status,
        course.academic_hours,
      ]);

      for (const inst of course.instructors) {
        instructoresSheet.addRow([
          cursoId,
          inst.full_name,
          inst.title,
          inst.description,
          inst.photo_url ?? '',
          inst.display_order,
        ]);
      }

      for (const mod of course.modules) {
        moduloSeq++;
        const moduloId = moduloSeq;

        modulosSheet.addRow([
          moduloId,
          cursoId,
          mod.title,
          mod.description ?? '',
          mod.display_order,
        ]);

        for (const ses of mod.sessions) {
          sesionSeq++;
          const sesionId = sesionSeq;

          sesionesSheet.addRow([
            sesionId,
            moduloId,
            ses.title,
            ses.description ?? '',
            ses.youtube_url ?? '',
            ses.duration_minutes,
            ses.display_order,
            ses.video_provider,
            ses.drive_url ?? '',
          ]);

          for (const mat of ses.materials) {
            materialesSheet.addRow([
              sesionId,
              mat.name,
              mat.drive_url,
              mat.type,
            ]);
          }
        }
      }
    });

    for (const sheet of [
      cursosSheet,
      instructoresSheet,
      modulosSheet,
      sesionesSheet,
      materialesSheet,
    ]) {
      sheet.columns.forEach((col) => {
        col.width = 24;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B55A3' },
  };
}

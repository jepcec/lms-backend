import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ImportCoursesUseCase,
  ImportCourseInput,
  ImportModuleInput,
  ImportSessionInput,
  ImportMaterialInput,
  ImportInstructorInput,
} from './import-courses.use-case';

const LIST_SEP = '|';

function cellText(row: ExcelJS.Row, col: number): string {
  const value = row.getCell(col).value;
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cellNumber(row: ExcelJS.Row, col: number): number {
  const raw = row.getCell(col).value;
  return Number(raw);
}

function cellList(row: ExcelJS.Row, col: number): string[] {
  const text = cellText(row, col);
  if (!text) return [];
  return text
    .split(LIST_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

@Injectable()
export class ImportCoursesExcelUseCase {
  constructor(private readonly importCourses: ImportCoursesUseCase) {}

  async execute(fileBuffer: any, createdBy: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const cursosSheet = workbook.getWorksheet('Cursos');
    const instructoresSheet = workbook.getWorksheet('Instructores');
    const modulosSheet = workbook.getWorksheet('Modulos');
    const sesionesSheet = workbook.getWorksheet('Sesiones');
    const materialesSheet = workbook.getWorksheet('Materiales');

    if (!cursosSheet || !modulosSheet || !sesionesSheet) {
      throw new BadRequestException(
        'El archivo no tiene las hojas esperadas (Cursos, Modulos, Sesiones). Usa la plantilla exportada.',
      );
    }

    // Materiales agrupados por sesion_id local
    const materialesBySesionId = new Map<string, ImportMaterialInput[]>();
    for (const row of materialesSheet?.getRows(2, materialesSheet.rowCount - 1) ?? []) {
      const sesionId = cellText(row, 1);
      if (!sesionId) continue;
      const list = materialesBySesionId.get(sesionId) ?? [];
      list.push({
        name: cellText(row, 2),
        drive_url: cellText(row, 3),
        type: cellText(row, 4),
      });
      materialesBySesionId.set(sesionId, list);
    }

    // Sesiones agrupadas por modulo_id local
    const sesionesByModuloId = new Map<string, ImportSessionInput[]>();
    for (const row of sesionesSheet.getRows(2, sesionesSheet.rowCount - 1) ?? []) {
      const sesionId = cellText(row, 1);
      const moduloId = cellText(row, 2);
      if (!moduloId) continue;
      const list = sesionesByModuloId.get(moduloId) ?? [];
      list.push({
        title: cellText(row, 3),
        description: cellText(row, 4) || undefined,
        youtube_url: cellText(row, 5) || undefined,
        duration_minutes: cellNumber(row, 6),
        display_order: cellText(row, 7) ? cellNumber(row, 7) : undefined,
        video_provider: cellText(row, 8) || undefined,
        drive_url: cellText(row, 9) || undefined,
        materials: materialesBySesionId.get(sesionId) ?? [],
      });
      sesionesByModuloId.set(moduloId, list);
    }

    // Modulos agrupados por curso_id local
    const modulosByCursoId = new Map<string, ImportModuleInput[]>();
    for (const row of modulosSheet.getRows(2, modulosSheet.rowCount - 1) ?? []) {
      const moduloId = cellText(row, 1);
      const cursoId = cellText(row, 2);
      if (!cursoId) continue;
      const list = modulosByCursoId.get(cursoId) ?? [];
      list.push({
        title: cellText(row, 3),
        description: cellText(row, 4) || undefined,
        display_order: cellText(row, 5) ? cellNumber(row, 5) : undefined,
        sessions: sesionesByModuloId.get(moduloId) ?? [],
      });
      modulosByCursoId.set(cursoId, list);
    }

    // Instructores agrupados por curso_id local
    const instructoresByCursoId = new Map<string, ImportInstructorInput[]>();
    for (const row of instructoresSheet?.getRows(2, instructoresSheet.rowCount - 1) ?? []) {
      const cursoId = cellText(row, 1);
      if (!cursoId) continue;
      const list = instructoresByCursoId.get(cursoId) ?? [];
      list.push({
        full_name: cellText(row, 2),
        title: cellText(row, 3),
        description: cellText(row, 4) || undefined,
        photo_url: cellText(row, 5) || undefined,
        display_order: cellText(row, 6) ? cellNumber(row, 6) : undefined,
      });
      instructoresByCursoId.set(cursoId, list);
    }

    // Cursos: fila raíz
    const courses: ImportCourseInput[] = [];
    const cursosRows = cursosSheet.getRows(2, cursosSheet.rowCount - 1) ?? [];
    cursosRows.forEach((row, idx) => {
      const cursoId = cellText(row, 1);
      const title = cellText(row, 3);
      if (!cursoId && !title) return; // fila vacía

      courses.push({
        label: title || `fila ${idx + 2} de Cursos`,
        category_slug: cellText(row, 2),
        title,
        slug: cellText(row, 4) || undefined,
        tagline: cellText(row, 5),
        description: cellText(row, 6),
        level: cellText(row, 7),
        software_tools: cellList(row, 8),
        price_pen: cellNumber(row, 9),
        discount_price_pen: cellText(row, 10) ? cellNumber(row, 10) : null,
        price_usd: cellNumber(row, 11),
        discount_price_usd: cellText(row, 12) ? cellNumber(row, 12) : null,
        access_duration_months: cellNumber(row, 13),
        prerequisites: cellList(row, 14),
        outcomes: cellList(row, 15),
        status: cellText(row, 16),
        academic_hours: cellText(row, 17) ? cellNumber(row, 17) : undefined,
        instructors: instructoresByCursoId.get(cursoId) ?? [],
        modules: modulosByCursoId.get(cursoId) ?? [],
      });
    });

    return this.importCourses.execute(courses, createdBy);
  }
}

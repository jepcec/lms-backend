import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ImportCertificationGradesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string, fileBuffer: any) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, deleted_at: null },
      include: { modules: { orderBy: { display_order: 'asc' } } },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const sheet = workbook.getWorksheet('Notas');

    if (!sheet) {
      throw new BadRequestException(
        'El archivo no contiene la hoja "Notas". Usa la plantilla exportada.',
      );
    }

    // Fila 1 = encabezados: enrollment_id | Nombres | Apellidos | Email | Módulo1 ... | Promedio
    const moduleCount = course.modules.length;
    const errors: string[] = [];
    let processed = 0;

    const rows = sheet.getRows(2, sheet.rowCount - 1) ?? [];

    for (const row of rows) {
      const enrollmentId = row.getCell(1).text?.trim();
      if (!enrollmentId) continue;

      // Columnas de módulos: 5 → 4 + moduleCount
      const moduleGrades: { module_id: string; grade: number }[] = [];
      for (let i = 0; i < moduleCount; i++) {
        const cellValue = row.getCell(5 + i).value;
        if (cellValue === null || cellValue === undefined || cellValue === '')
          continue;

        const grade = Number(cellValue);
        if (isNaN(grade) || grade < 0 || grade > 20) {
          errors.push(
            `Fila ${row.number}: nota inválida "${cellValue}" en módulo "${course.modules[i].title}" (debe ser 0–20)`,
          );
          continue;
        }

        moduleGrades.push({ module_id: course.modules[i].id, grade });
      }

      if (errors.length > 0) continue;

      // Upsert notas por módulo
      await Promise.all(
        moduleGrades.map((mg) =>
          this.prisma.enrollmentModuleGrade.upsert({
            where: {
              enrollment_id_module_id: {
                enrollment_id: enrollmentId,
                module_id: mg.module_id,
              },
            },
            update: { grade: mg.grade },
            create: {
              enrollment_id: enrollmentId,
              module_id: mg.module_id,
              grade: mg.grade,
            },
          }),
        ),
      );

      // Calcular y guardar promedio
      if (moduleGrades.length > 0) {
        const avg =
          moduleGrades.reduce((sum, mg) => sum + mg.grade, 0) /
          moduleGrades.length;

        await this.prisma.enrollment.update({
          where: { id: enrollmentId },
          data: { average_grade: Math.round(avg * 100) / 100 },
        });
      }

      processed++;
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'El archivo contiene errores de validación',
        errors,
      });
    }

    return { success: true, processed };
  }
}

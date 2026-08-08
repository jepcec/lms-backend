import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportCertificationExcelUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string): Promise<Buffer> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, deleted_at: null },
      include: { modules: { orderBy: { display_order: 'asc' } } },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId },
      include: {
        student: { select: { first_name: true, last_name: true, email: true } },
        module_grades: true,
      },
      orderBy: { enrolled_at: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notas');

    // Encabezados
    const headers = [
      'enrollment_id',
      'Nombres',
      'Apellidos',
      'Email',
      ...course.modules.map((m) => m.title),
      'Promedio',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B55A3' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Ancho de columnas
    sheet.getColumn(1).width = 38; // enrollment_id
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 28;
    for (let i = 5; i <= 4 + course.modules.length; i++) {
      sheet.getColumn(i).width = 18;
    }
    sheet.getColumn(5 + course.modules.length).width = 12;

    // Ocultar columna enrollment_id (col 1) para que no confunda pero se conserve para el import
    sheet.getColumn(1).hidden = true;

    // Filas de estudiantes
    for (const enrollment of enrollments) {
      const gradesMap: Record<string, number> = {};
      for (const mg of enrollment.module_grades) {
        gradesMap[mg.module_id] = Number(mg.grade);
      }

      const moduleGrades = course.modules.map((m) => gradesMap[m.id] ?? null);
      const filledGrades = moduleGrades.filter((g) => g !== null);
      const average =
        filledGrades.length > 0
          ? filledGrades.reduce((a, b) => a + b, 0) / filledGrades.length
          : null;

      sheet.addRow([
        enrollment.id,
        enrollment.student.first_name,
        enrollment.student.last_name,
        enrollment.student.email,
        ...moduleGrades,
        average !== null ? Math.round(average * 100) / 100 : '',
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

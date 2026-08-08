import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../../../core/database/prisma.service';

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  completado: 'Completado',
  inactivo: 'Inactivo',
};

@Injectable()
export class ExportMatriculadosCursoExcelUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(cursoId: string): Promise<Buffer> {
    const course = await this.prisma.course.findUnique({
      where: { id: cursoId },
      select: { id: true, title: true },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: cursoId },
      include: {
        student: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Matriculados');

    const headers = [
      'Nombres',
      'Apellidos',
      'Email',
      'Teléfono',
      'Fecha de matrícula',
      'Progreso (%)',
      'Última actividad',
      'Estado',
      'Tipo de matrícula',
      'Método de pago',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B55A3' },
    };

    sheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 28 },
      { width: 18 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
      { width: 18 },
    ];

    for (const enrollment of enrollments) {
      const progressPercent = enrollment.progress_percent.toNumber();
      const status = enrollment.completed_at
        ? 'completado'
        : progressPercent === 0
          ? 'inactivo'
          : 'activo';

      sheet.addRow([
        enrollment.student.first_name,
        enrollment.student.last_name,
        enrollment.student.email,
        enrollment.student.phone ?? '',
        enrollment.enrolled_at.toLocaleDateString('es-PE'),
        progressPercent,
        enrollment.last_accessed_at
          ? enrollment.last_accessed_at.toLocaleDateString('es-PE')
          : '',
        STATUS_LABELS[status] ?? status,
        enrollment.enrollment_type === 'online' ? 'Online' : 'Manual',
        enrollment.offline_payment_method ?? '',
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CertificatePdfService } from '../services/certificate-pdf.service';

@Injectable()
export class GenerateAllCertificationsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: CertificatePdfService,
  ) {}

  async execute(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, deleted_at: null },
      select: { id: true, certification_mode: true },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    if (course.certification_mode !== 'manual') {
      throw new BadRequestException(
        'Este curso no usa modo de certificación manual',
      );
    }

    // Genera (o regenera) todos los PDFs del curso sin filtrar por estado
    const { generated, failed, errors } =
      await this.pdfService.generateAllForCourse(courseId);

    return {
      success: failed === 0,
      generated,
      failed,
      errors,
      message:
        generated === 0
          ? 'No hay certificados emitidos en este curso'
          : failed === 0
          ? `${generated} PDF(s) generados correctamente`
          : `${generated} generados, ${failed} con error`,
    };
  }
}

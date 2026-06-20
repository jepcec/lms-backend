import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CertificatePdfService } from '../../../cources/application/services/certificate-pdf.service';

export class SubmitReviewDto {
  course_id: string;
  enrollment_id: string;
  rating: number;
  comment: string;
}

@Injectable()
export class SubmitReviewUseCase {
  private readonly logger = new Logger(SubmitReviewUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: CertificatePdfService,
  ) {}

  async execute(userId: string, dto: SubmitReviewDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: dto.enrollment_id,
        user_id: userId,
        course_id: dto.course_id,
      },
      include: {
        course: {
          select: {
            certification_mode: true,
            certificate_template_id: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    if (enrollment.progress_percent.toNumber() < 100) {
      throw new BadRequestException(
        'Debes completar el curso al 100% antes de dejar una reseña',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { enrollment_id: dto.enrollment_id },
    });

    if (existing) {
      throw new ConflictException('Ya dejaste una reseña para este curso');
    }

    const review = await this.prisma.review.create({
      data: {
        user_id: userId,
        course_id: dto.course_id,
        enrollment_id: dto.enrollment_id,
        rating: dto.rating,
        comment: dto.comment,
        status: 'approved',
      },
    });

    // Actualizar avg_rating y review_count del curso
    const allReviews = await this.prisma.review.findMany({
      where: { course_id: dto.course_id, status: 'approved' },
      select: { rating: true },
    });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await this.prisma.course.update({
      where: { id: dto.course_id },
      data: {
        avg_rating: Math.round(avgRating * 10) / 10,
        review_count: allReviews.length,
      },
    });

    // Generar certificado automático (solo en modo auto y con plantilla configurada)
    let certificate_available = false;
    const { course } = enrollment;

    if (
      course.certification_mode === 'auto' &&
      course.certificate_template_id
    ) {
      try {
        const cert = await this.prisma.certificate.create({
          data: {
            enrollment_id: dto.enrollment_id,
            template_id: course.certificate_template_id,
            type: 'Certificado',
            pdf_url: 'PENDIENTE_GENERACION_PDF',
            review_id: review.id,
          },
        });
        certificate_available = true;

        // Generar PDF en background sin bloquear la respuesta
        void this.pdfService.generateForCertificate(cert.id).catch((err) => {
          this.logger.error(
            `Error generando PDF auto para certificado ${cert.id}: ${err?.message ?? err}`,
          );
        });
      } catch (err) {
        // Si el certificado ya existe, no es error fatal
        this.logger.warn(
          `No se pudo crear certificado para enrollment ${dto.enrollment_id}: ${(err as Error)?.message}`,
        );
      }
    }

    return { id: review.id, certificate_available };
  }
}

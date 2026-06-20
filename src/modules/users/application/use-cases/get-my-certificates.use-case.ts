import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetMyCertificatesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: {
        enrollment: {
          user_id: userId,
        },
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { issued_at: 'desc' },
    });

    return certificates.map((cert) => ({
      id: cert.id,
      enrollment_id: cert.enrollment_id,
      course_title: cert.enrollment.course.title,
      verification_code: cert.verification_code,
      pdf_url: cert.pdf_url,
      issued_at: cert.issued_at,
    }));
  }
}

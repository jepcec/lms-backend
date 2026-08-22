import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetMyCertificatesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const [certificates, moduleCertificates] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { enrollment: { user_id: userId } },
        include: {
          enrollment: {
            include: { course: { select: { title: true } } },
          },
        },
        orderBy: { issued_at: 'desc' },
      }),
      this.prisma.moduleCertificate.findMany({
        where: { enrollment: { user_id: userId } },
        include: {
          enrollment: {
            include: { course: { select: { title: true } } },
          },
          module: { select: { title: true } },
        },
        orderBy: { issued_at: 'desc' },
      }),
    ]);

    const courseCerts = certificates.map((cert) => ({
      id: cert.id,
      scope: 'course' as const,
      enrollment_id: cert.enrollment_id,
      course_title: cert.enrollment.course.title,
      module_title: null,
      verification_code: cert.verification_code,
      issued_at: cert.issued_at,
    }));

    const moduleCerts = moduleCertificates.map((cert) => ({
      id: cert.id,
      scope: 'module' as const,
      enrollment_id: cert.enrollment_id,
      course_title: cert.enrollment.course.title,
      module_title: cert.module.title,
      verification_code: cert.verification_code,
      issued_at: cert.issued_at,
    }));

    return [...courseCerts, ...moduleCerts].sort(
      (a, b) => b.issued_at.getTime() - a.issued_at.getTime(),
    );
  }
}

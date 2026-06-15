import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class VerifyCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { verification_code: code },
      include: {
        enrollment: {
          include: {
            course: {
              include: {
                instructors: { orderBy: { display_order: 'asc' } },
              },
            },
            student: true,
          },
        },
      },
    });

    if (!cert) throw new NotFoundException('Certificado no encontrado');

    const { enrollment } = cert;
    const { course, student } = enrollment;

    return {
      verification_code: cert.verification_code,
      type: cert.type,
      pdf_url: cert.pdf_url,
      student_name: `${student.first_name} ${student.last_name}`,
      course_title: course.title,
      issued_at: cert.issued_at,
      total_hours: Math.round(course.total_duration_minutes / 60),
      instructors: course.instructors.map((i) => i.full_name),
    };
  }
}

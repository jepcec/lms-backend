import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const certificate = await this.prisma.certificate.findFirst({
      where: { id, revoked_at: null },
      include: {
        enrollment: {
          include: {
            course: {
              include: {
                instructors: {
                  orderBy: { display_order: 'asc' },
                },
              },
            },
            student: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado no encontrado`);
    }

    const { enrollment } = certificate;
    const { course, student } = enrollment;

    return {
      id: certificate.id,
      verification_code: certificate.verification_code,
      course_title: course.title,
      student_name: `${student.first_name} ${student.last_name}`,
      issued_at: certificate.issued_at,
      total_hours: Math.round(course.total_duration_minutes / 60),
      instructors: course.instructors.map((i) => i.full_name),
    };
  }
}

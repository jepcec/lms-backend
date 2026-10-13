import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetStudentCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(enrollmentId: string, userId: string) {
    const cert = await this.prisma.certificate.findFirst({
      where: { enrollment_id: enrollmentId, revoked_at: null },
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

    if (!cert || cert.enrollment.user_id !== userId) {
      throw new NotFoundException('Certificado no encontrado');
    }

    const { enrollment } = cert;
    const { course, student } = enrollment;

    return {
      id: cert.id,
      verification_code: cert.verification_code,
      course_title: course.title,
      student_name: `${student.first_name} ${student.last_name}`,
      issued_at: cert.issued_at,
      total_hours: Math.round(course.total_duration_minutes / 60),
      instructors: course.instructors.map((i) => i.full_name),
    };
  }
}

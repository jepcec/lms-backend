import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetStudentModuleCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(moduleCertificateId: string, userId: string) {
    const cert = await this.prisma.moduleCertificate.findFirst({
      where: { id: moduleCertificateId, revoked_at: null },
      include: {
        module: { select: { title: true } },
        enrollment: {
          include: {
            course: { select: { title: true } },
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
      module_title: cert.module.title,
      student_name: `${student.first_name} ${student.last_name}`,
      issued_at: cert.issued_at,
    };
  }
}

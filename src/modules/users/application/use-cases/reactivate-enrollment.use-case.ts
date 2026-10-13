import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ReactivateEnrollmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(enrollmentId: string, actorUserId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { first_name: true, last_name: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { suspended_at: null },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: actorUserId,
        entity_type: 'Enrollment',
        entity_id: enrollmentId,
        action: 'update',
        changes: {
          before: { suspended_at: enrollment.suspended_at },
          after: {
            suspended_at: null,
            student: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
            course: enrollment.course.title,
          },
        },
      },
    });

    return { message: 'Matrícula reactivada exitosamente' };
  }
}

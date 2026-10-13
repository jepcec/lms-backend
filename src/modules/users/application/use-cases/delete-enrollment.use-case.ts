import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class DeleteEnrollmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(enrollmentId: string, actorUserId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        review: { select: { id: true } },
        certificate: { select: { id: true } },
        student: { select: { first_name: true, last_name: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    const courseId = enrollment.course_id;
    const hadReview = enrollment.review !== null;

    await this.prisma.$transaction(async (tx) => {
      await tx.certificate.deleteMany({
        where: { enrollment_id: enrollmentId },
      });
      await tx.review.deleteMany({ where: { enrollment_id: enrollmentId } });
      await tx.enrollment.delete({ where: { id: enrollmentId } });
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrolled_count: { decrement: 1 } },
    });

    if (hadReview) {
      const stats = await this.prisma.review.aggregate({
        where: { course_id: courseId },
        _avg: { rating: true },
        _count: true,
      });
      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          avg_rating: stats._avg.rating ?? 0,
          review_count: stats._count,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        user_id: actorUserId,
        entity_type: 'Enrollment',
        entity_id: enrollmentId,
        action: 'delete',
        changes: {
          before: {
            user_id: enrollment.user_id,
            student: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
            course_id: enrollment.course_id,
            course: enrollment.course.title,
            enrollment_type: enrollment.enrollment_type,
          },
          after: null,
        },
      },
    });

    return { message: 'Matrícula eliminada correctamente' };
  }
}

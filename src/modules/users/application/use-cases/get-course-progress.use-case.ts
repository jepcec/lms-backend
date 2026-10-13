import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCourseProgressUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
      include: {
        lesson_progress: true,
        review: { select: { id: true } },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('No estás matriculado en este curso');
    }

    if (enrollment.suspended_at) {
      throw new ForbiddenException('Tu acceso a este curso ha sido suspendido');
    }

    if (enrollment.access_expires_at && enrollment.access_expires_at < new Date()) {
      throw new ForbiddenException('Tu acceso a este curso ha vencido');
    }

    return {
      enrollment: {
        id: enrollment.id,
        progress_percent: enrollment.progress_percent.toNumber(),
        completed_at: enrollment.completed_at?.toISOString() ?? null,
      },
      lesson_progress: enrollment.lesson_progress.map((lp) => ({
        id: lp.id,
        enrollment_id: lp.enrollment_id,
        session_id: lp.session_id,
        watched_seconds: lp.watched_seconds,
        completed: lp.completed,
        completed_at: lp.completed_at?.toISOString() ?? null,
        last_watched_at: lp.last_watched_at.toISOString(),
      })),
      has_review: enrollment.review !== null,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class UpdateSessionProgressUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, sessionId: string, watchedSeconds: number) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    sessions: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const courseId = session.module.course_id;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    });

    if (!enrollment) {
      throw new ForbiddenException('No estás matriculado en este curso');
    }

    const totalDurationSeconds = session.duration_minutes * 60;
    const completed = watchedSeconds >= totalDurationSeconds * 0.9;

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollment_id_session_id: {
          enrollment_id: enrollment.id,
          session_id: sessionId,
        },
      },
      create: {
        enrollment_id: enrollment.id,
        session_id: sessionId,
        watched_seconds: watchedSeconds,
        completed,
        completed_at: completed ? new Date() : null,
      },
      update: {
        watched_seconds: watchedSeconds,
        completed,
        completed_at: completed ? new Date() : null,
      },
    });

    const allSessions = session.module.course.modules.flatMap(
      (m) => m.sessions,
    );
    const totalSessions = allSessions.length;

    const completedProgress = await this.prisma.lessonProgress.count({
      where: {
        enrollment_id: enrollment.id,
        completed: true,
      },
    });

    const progressPercent = Math.round(
      (completedProgress / totalSessions) * 100,
    );

    const updateData: Record<string, unknown> = {
      progress_percent: progressPercent,
      last_accessed_at: new Date(),
    };

    if (progressPercent >= 100) {
      updateData.completed_at = new Date();
    }

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    });

    return {
      completed,
      progress_percent: progressPercent,
    };
  }
}

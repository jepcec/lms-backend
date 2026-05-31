import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';

@Injectable()
export class GetTopEstudiantesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AdminFiltersDto) {
    const enrollmentWhere: Record<string, unknown> = {};
    if (filters.desde || filters.hasta) {
      const enrolledAt: Record<string, Date> = {};
      if (filters.desde) enrolledAt.gte = new Date(filters.desde);
      if (filters.hasta) enrolledAt.lte = new Date(filters.hasta);
      enrollmentWhere.enrolled_at = enrolledAt;
    }

    const estudiantes = await this.prisma.user.findMany({
      where: { role: 'estudiante', status: 'active' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        enrollments: {
          where: enrollmentWhere,
          select: {
            completed_at: true,
            lesson_progress: {
              select: { watched_seconds: true },
            },
          },
        },
      },
    });

    const result = estudiantes
      .map((user) => {
        const totalWatchedSeconds = user.enrollments.reduce(
          (sum, e) =>
            sum +
            e.lesson_progress.reduce((s, lp) => s + lp.watched_seconds, 0),
          0,
        );
        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          courses_count: user.enrollments.length,
          completed_count: user.enrollments.filter((e) => e.completed_at)
            .length,
          total_watched_hours:
            Math.round((totalWatchedSeconds / 3600) * 100) / 100,
        };
      })
      .sort((a, b) => b.courses_count - a.courses_count)
      .slice(0, 10);

    return result;
  }
}

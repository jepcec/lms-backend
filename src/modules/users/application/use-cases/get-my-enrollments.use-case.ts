import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetMyEnrollmentsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            level: true,
            total_duration_minutes: true,
          },
        },
        lesson_progress: {
          select: { watched_seconds: true },
        },
        review: {
          select: { id: true },
        },
      },
      orderBy: { last_accessed_at: { sort: 'desc', nulls: 'last' } },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      course: enrollment.course,
      order_id: enrollment.order_id,
      enrolled_at: enrollment.enrolled_at.toISOString(),
      access_expires_at: enrollment.access_expires_at?.toISOString() ?? null,
      enrollment_type: enrollment.enrollment_type,
      offline_payment_method: enrollment.offline_payment_method,
      offline_amount: enrollment.offline_amount
        ? enrollment.offline_amount.toNumber()
        : undefined,
      enrolled_by: enrollment.enrolled_by,
      internal_notes: enrollment.internal_notes,
      progress_percent: enrollment.progress_percent.toNumber(),
      completed_at: enrollment.completed_at?.toISOString(),
      last_accessed_at: enrollment.last_accessed_at?.toISOString(),
      total_watched_seconds: enrollment.lesson_progress.reduce(
        (sum, lp) => sum + lp.watched_seconds,
        0,
      ),
      has_review: enrollment.review !== null,
    }));
  }
}

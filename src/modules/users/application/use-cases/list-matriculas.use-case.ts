import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { MatriculasParams } from '../dtos/matriculas-params.dto';

@Injectable()
export class ListMatriculasUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: MatriculasParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where.student = {
        OR: [
          { first_name: { contains: params.search, mode: 'insensitive' } },
          { last_name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    if (params.curso_id) {
      where.course_id = params.curso_id;
    }

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              country: true,
              role: true,
              profile_photo_url: true,
              email_verified: true,
              status: true,
              created_by: true,
              created_at: true,
              updated_at: true,
            },
          },
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
        orderBy: { enrolled_at: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const total_pages = Math.ceil(total / limit);

    return {
      data: data.map((enrollment) => ({
        id: enrollment.id,
        user_id: enrollment.user_id,
        user: enrollment.student,
        course_id: enrollment.course_id,
        course: enrollment.course,
        order_id: enrollment.order_id,
        enrolled_at: enrollment.enrolled_at.toISOString(),
        access_expires_at: enrollment.access_expires_at?.toISOString() ?? null,
        enrollment_type: enrollment.enrollment_type,
        offline_payment_method: enrollment.offline_payment_method,
        offline_amount: enrollment.offline_amount
          ? Number(enrollment.offline_amount)
          : undefined,
        enrolled_by: enrollment.enrolled_by,
        internal_notes: enrollment.internal_notes,
        progress_percent: Number(enrollment.progress_percent),
        completed_at: enrollment.completed_at?.toISOString(),
        last_accessed_at: enrollment.last_accessed_at?.toISOString(),
        total_watched_seconds: enrollment.lesson_progress.reduce(
          (sum, lp) => sum + lp.watched_seconds,
          0,
        ),
        has_review: enrollment.review !== null,
      })),
      total,
      page,
      limit,
      total_pages,
    };
  }
}

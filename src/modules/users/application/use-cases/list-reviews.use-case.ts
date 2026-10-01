import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import type { ReviewStatus } from 'src/generated/prisma/enums';

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  course_id?: string;
  status?: ReviewStatus;
}

@Injectable()
export class ListReviewsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: ListReviewsParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.course_id) where.course_id = params.course_id;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, profile_photo_url: true },
          },
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }
}

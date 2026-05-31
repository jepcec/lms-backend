import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';

@Injectable()
export class GetTopCursosUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AdminFiltersDto) {
    const where: Record<string, unknown> = {
      status: 'published',
      deleted_at: null,
    };

    if (filters.categoria_id) {
      where.category_id = filters.categoria_id;
    }

    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { enrolled_count: 'desc' },
      take: 10,
    });

    const courseIds = courses.map((c) => c.id);

    const enrollments = await this.prisma.enrollment.groupBy({
      by: ['course_id'],
      where: {
        course_id: { in: courseIds },
        ...this.buildDateFilter(filters),
      },
      _sum: { offline_amount: true },
    });

    const ordersData = await this.prisma.orderItem.findMany({
      where: {
        course_id: { in: courseIds },
        order: {
          payment_status: 'paid',
          ...this.buildOrderDateFilter(filters),
        },
      },
      select: {
        course_id: true,
        final_price: true,
      },
    });

    const revenueByCourse = new Map<string, number>();

    for (const item of ordersData) {
      const current = revenueByCourse.get(item.course_id) ?? 0;
      revenueByCourse.set(
        item.course_id,
        current + item.final_price.toNumber(),
      );
    }

    for (const e of enrollments) {
      if (e._sum.offline_amount) {
        const current = revenueByCourse.get(e.course_id) ?? 0;
        revenueByCourse.set(
          e.course_id,
          current + e._sum.offline_amount.toNumber(),
        );
      }
    }

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      enrolled_count: course.enrolled_count,
      revenue: Math.round((revenueByCourse.get(course.id) ?? 0) * 100) / 100,
    }));
  }

  private buildDateFilter(filters: AdminFiltersDto) {
    const filter: Record<string, unknown> = {};
    if (filters.desde || filters.hasta) {
      const enrolledAt: Record<string, Date> = {};
      if (filters.desde) enrolledAt.gte = new Date(filters.desde);
      if (filters.hasta) enrolledAt.lte = new Date(filters.hasta);
      filter.enrolled_at = enrolledAt;
    }
    return filter;
  }

  private buildOrderDateFilter(filters: AdminFiltersDto) {
    const filter: Record<string, unknown> = {};
    if (filters.desde || filters.hasta) {
      const createdAt: Record<string, Date> = {};
      if (filters.desde) createdAt.gte = new Date(filters.desde);
      if (filters.hasta) createdAt.lte = new Date(filters.hasta);
      filter.created_at = createdAt;
    }
    return filter;
  }
}

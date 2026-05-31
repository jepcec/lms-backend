import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CursoParams } from '../dtos/curso-params.dto';

@Injectable()
export class ListCatalogUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: CursoParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      status: params.status || 'published',
    };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { tagline: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoria_id) {
      where.category_id = params.categoria_id;
    }

    if (params.categoria_ids) {
      const ids = params.categoria_ids
        .split(',')
        .filter((id) => id.trim() !== '');
      if (ids.length > 0) {
        where.category_id = { in: ids };
      }
    }

    if (params.min_rating) {
      where.avg_rating = { gte: Number(params.min_rating) };
    }

    if (params.softwares) {
      const softwareList = params.softwares
        .split(',')
        .filter((s) => s.trim() !== '');
      if (softwareList.length > 0) {
        where.software_tools = { hasSome: softwareList };
      }
    }

    if (params.min_price !== undefined || params.max_price !== undefined) {
      where.price = {};
      if (params.min_price !== undefined) {
        where.price.gte = Number(params.min_price);
      }
      if (params.max_price !== undefined) {
        where.price.lte = Number(params.max_price);
      }
    }

    if (params.duration) {
      // duration: '<10' | '10-30' | '>30' (assuming hours)
      // total_duration_minutes is in minutes
      if (params.duration === '<10') {
        where.total_duration_minutes = { lt: 10 * 60 };
      } else if (params.duration === '10-30') {
        where.total_duration_minutes = { gte: 10 * 60, lte: 30 * 60 };
      } else if (params.duration === '>30') {
        where.total_duration_minutes = { gt: 30 * 60 };
      }
    }

    let orderBy: any = { created_at: 'desc' };
    if (params.sort) {
      switch (params.sort) {
        case 'popular':
          orderBy = { enrolled_count: 'desc' };
          break;
        case 'best_rated':
          orderBy = { avg_rating: 'desc' };
          break;
        case 'recent':
          orderBy = { published_at: { sort: 'desc', nulls: 'last' } };
          break;
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          instructors: {
            orderBy: { display_order: 'asc' },
          },
        },
        orderBy,
      }),
      this.prisma.course.count({ where }),
    ]);

    const total_pages = Math.ceil(total / limit);

    return {
      data: data.map((course) => ({
        id: course.id,
        category_id: course.category_id,
        category: course.category,
        title: course.title,
        slug: course.slug,
        tagline: course.tagline,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        level: course.level,
        software_tools: course.software_tools,
        price: Number(course.price),
        discount_price: course.discount_price
          ? Number(course.discount_price)
          : undefined,
        currency: course.currency,
        access_duration: course.access_duration,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        status: course.status,
        published_at: course.published_at?.toISOString(),
        avg_rating: Number(course.avg_rating),
        review_count: course.review_count,
        enrolled_count: course.enrolled_count,
        total_duration_minutes: course.total_duration_minutes,
        instructors: course.instructors,
        created_by: course.created_by,
        created_at: course.created_at.toISOString(),
        updated_at: course.updated_at.toISOString(),
      })),
      total,
      page,
      limit,
      total_pages,
    };
  }
}

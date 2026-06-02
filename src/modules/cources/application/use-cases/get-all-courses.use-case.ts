import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CursoParams } from '../dtos/curso-params.dto';

@Injectable()
export class GetAllCoursesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: CursoParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deleted_at: null };

    // Búsqueda por texto
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { tagline: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Filtro por estado
    if (params.status) {
      where.status = params.status;
    }

    // Filtro por categorías (una o múltiples separadas por coma)
    if (params.categoria_ids) {
      const ids = params.categoria_ids
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) where.category_id = { in: ids };
    } else if (params.categoria_id) {
      where.category_id = params.categoria_id;
    }

    // Filtro por calificación mínima
    if (params.min_rating) {
      where.avg_rating = { gte: Number(params.min_rating) };
    }

    // Filtro por rango de precio
    if (params.min_price || params.max_price) {
      const priceFilter: Record<string, number> = {};
      if (params.min_price) priceFilter.gte = Number(params.min_price);
      if (params.max_price) priceFilter.lte = Number(params.max_price);
      where.price = priceFilter;
    }

    // Filtro por duración (en horas → convertir a minutos)
    if (params.duration) {
      if (params.duration === '<10') {
        where.total_duration_minutes = { lt: 600 };
      } else if (params.duration === '10-30') {
        where.total_duration_minutes = { gte: 600, lte: 1800 };
      } else if (params.duration === '>30') {
        where.total_duration_minutes = { gt: 1800 };
      }
    }

    // Filtro por softwares (array, hasSome = al menos uno coincide)
    if (params.softwares) {
      const softwareList = params.softwares
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (softwareList.length > 0) {
        where.software_tools = { hasSome: softwareList };
      }
    }

    // Ordenamiento
    const ASC = 'asc' as const;
    const DESC = 'desc' as const;
    let orderBy: Record<string, typeof ASC | typeof DESC> = {
      created_at: DESC,
    };
    switch (params.sort) {
      case 'popular':
        orderBy = { enrolled_count: DESC };
        break;
      case 'best_rated':
        orderBy = { avg_rating: DESC };
        break;
      case 'recent':
        orderBy = { created_at: DESC };
        break;
      case 'price_asc':
        orderBy = { price: ASC };
        break;
      case 'price_desc':
        orderBy = { price: DESC };
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          instructors: { orderBy: { display_order: 'asc' } },
        },
        orderBy,
      }),
      this.prisma.course.count({ where }),
    ]);

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
      total_pages: Math.ceil(total / limit),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';
import { CursoParams } from '../dtos/curso-params.dto';
import { buildCourseFilterWhere, buildCourseOrderBy } from '../utils/course-filters';
import { fuzzySearchIds } from '../../../../core/database/fuzzy-search';

@Injectable()
export class GetAllCoursesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: CursoParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const skip = (page - 1) * limit;

    const where = await buildCourseFilterWhere(this.prisma, params);
    const orderBy = buildCourseOrderBy(params.sort);

    let data: Awaited<ReturnType<typeof this.findPage>>;
    let total: number;

    if (params.search && !params.sort) {
      // Con búsqueda y sin orden elegido: los más exactos primero (exacto > empieza
      // igual > contiene > parecido), como en Matrículas. Se ordenan los ids de todo
      // lo que coincide y se pagina sobre ese orden.
      const rank = await fuzzySearchIds(this.prisma, 'courses', ['title', 'tagline'], params.search);
      const position = new Map(rank.map((id, i) => [id, i]));
      const matches = await this.prisma.course.findMany({
        where,
        select: { id: true, created_at: true },
      });
      matches.sort(
        (a, b) =>
          (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity) ||
          b.created_at.getTime() - a.created_at.getTime(),
      );
      const pageIds = matches.slice(skip, skip + limit).map((m) => m.id);
      const rows = await this.findPage({ id: { in: pageIds } });
      const pagePosition = new Map(pageIds.map((id, i) => [id, i]));
      data = rows.sort((a, b) => (pagePosition.get(a.id) ?? 0) - (pagePosition.get(b.id) ?? 0));
      total = matches.length;
    } else {
      [data, total] = await Promise.all([
        this.findPage(where, { skip, take: limit, orderBy }),
        this.prisma.course.count({ where }),
      ]);
    }

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
        price_pen: Number(course.price_pen),
        discount_price_pen: course.discount_price_pen
          ? Number(course.discount_price_pen)
          : undefined,
        price_usd: Number(course.price_usd),
        discount_price_usd: course.discount_price_usd
          ? Number(course.discount_price_usd)
          : undefined,
        access_duration_months: course.access_duration_months,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        status: course.status,
        published_at: course.published_at?.toISOString(),
        avg_rating: Number(course.avg_rating),
        review_count: course.review_count,
        enrolled_count: course.enrolled_count,
        total_duration_minutes: course.total_duration_minutes,
        academic_hours: course.academic_hours,
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

  private findPage(
    where: Record<string, unknown>,
    page: { skip?: number; take?: number; orderBy?: ReturnType<typeof buildCourseOrderBy> } = {},
  ) {
    return this.prisma.course.findMany({
      where,
      include: {
        category: true,
        instructors: { orderBy: { display_order: 'asc' } },
      },
      ...page,
    });
  }
}

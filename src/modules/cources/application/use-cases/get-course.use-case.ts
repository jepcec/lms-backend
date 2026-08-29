import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class GetCourseUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructors: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return {
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
    };
  }

  async executeBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        instructors: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return {
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
    };
  }
}

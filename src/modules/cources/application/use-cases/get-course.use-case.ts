import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

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
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ExportCoursesJsonUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const courses = await this.prisma.course.findMany({
      where: { deleted_at: null },
      include: {
        category: { select: { slug: true } },
        instructors: {
          orderBy: { display_order: 'asc' },
          select: {
            full_name: true,
            title: true,
            description: true,
            photo_url: true,
            display_order: true,
          },
        },
        modules: {
          orderBy: { display_order: 'asc' },
          select: {
            title: true,
            description: true,
            display_order: true,
            sessions: {
              orderBy: { display_order: 'asc' },
              select: {
                title: true,
                description: true,
                youtube_url: true,
                duration_minutes: true,
                display_order: true,
                materials: {
                  select: { name: true, drive_url: true, type: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return courses.map((course) => ({
      category_slug: course.category.slug,
      title: course.title,
      slug: course.slug,
      tagline: course.tagline,
      description: course.description,
      level: course.level,
      software_tools: course.software_tools,
      price_pen: Number(course.price_pen),
      discount_price_pen:
        course.discount_price_pen !== null
          ? Number(course.discount_price_pen)
          : null,
      price_usd: Number(course.price_usd),
      discount_price_usd:
        course.discount_price_usd !== null
          ? Number(course.discount_price_usd)
          : null,
      access_duration_months: course.access_duration_months,
      prerequisites: course.prerequisites,
      outcomes: course.outcomes,
      status: course.status,
      academic_hours: course.academic_hours,
      instructors: course.instructors,
      modules: course.modules,
    }));
  }
}

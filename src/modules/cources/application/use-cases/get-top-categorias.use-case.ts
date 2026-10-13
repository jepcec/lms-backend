import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class GetTopCategoriasUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(limit = 3) {
    const categories = await this.prisma.category.findMany({
      include: {
        courses: {
          where: { status: 'published', deleted_at: null },
          select: { enrolled_count: true },
        },
      },
    });

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        total_enrolled: cat.courses.reduce((sum, c) => sum + c.enrolled_count, 0),
      }))
      .filter((cat) => cat.total_enrolled > 0)
      .sort((a, b) => b.total_enrolled - a.total_enrolled)
      .slice(0, limit);
  }
}

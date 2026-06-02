import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCategoriasDistribucionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: {
              where: { status: 'published', deleted_at: null },
            },
          },
        },
      },
      orderBy: { display_order: 'asc' },
    });

    return categories
      .map((cat) => ({
        name: cat.name,
        count: cat._count.courses,
      }))
      .filter((cat) => cat.count > 0);
  }
}

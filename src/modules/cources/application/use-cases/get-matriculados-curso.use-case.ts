import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class GetMatriculadosCursoUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    courseId: string,
    params: { page?: number; limit?: number; search?: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { course_id: courseId };

    if (params.search) {
      where.student = {
        OR: [
          { first_name: { contains: params.search, mode: 'insensitive' } },
          { last_name: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { enrolled_at: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const total_pages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      total_pages,
    };
  }
}

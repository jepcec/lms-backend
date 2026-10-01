import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import type { ReviewStatus } from 'src/generated/prisma/enums';

export class UpdateReviewStatusDto {
  status: ReviewStatus;
}

@Injectable()
export class UpdateReviewStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, dto: UpdateReviewStatusDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: dto.status },
    });

    // El promedio y contador visibles del curso solo consideran reseñas aprobadas,
    // así que hay que recalcularlos cada vez que se oculta/muestra una.
    const approvedReviews = await this.prisma.review.findMany({
      where: { course_id: review.course_id, status: 'approved' },
      select: { rating: true },
    });
    const avgRating =
      approvedReviews.length > 0
        ? Math.round(
            (approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length) *
              10,
          ) / 10
        : 0;

    await this.prisma.course.update({
      where: { id: review.course_id },
      data: { avg_rating: avgRating, review_count: approvedReviews.length },
    });

    return { id: updated.id, status: updated.status };
  }
}

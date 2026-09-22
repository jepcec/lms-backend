import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class GetCourseReviewsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string) {
    return this.prisma.review.findMany({
      where: { course_id: courseId, status: 'approved' },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, profile_photo_url: true },
        },
      },
    });
  }
}

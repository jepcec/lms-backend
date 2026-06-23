import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetStudentDetailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            level: true,
            total_duration_minutes: true,
          },
        },
        lesson_progress: {
          select: { watched_seconds: true },
        },
        review: {
          select: { id: true },
        },
        certificate: {
          select: {
            id: true,
            verification_code: true,
            type: true,
            issued_at: true,
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });

    return {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        role: user.role,
        profile_photo_url: user.profile_photo_url,
        email_verified: user.email_verified,
        status: user.status,
        created_at: user.created_at.toISOString(),
      },
      enrollments: enrollments.map((e) => ({
        id: e.id,
        course_id: e.course_id,
        course: e.course,
        enrolled_at: e.enrolled_at.toISOString(),
        enrollment_type: e.enrollment_type,
        offline_payment_method: e.offline_payment_method,
        progress_percent: e.progress_percent.toNumber(),
        completed_at: e.completed_at?.toISOString(),
        last_accessed_at: e.last_accessed_at?.toISOString(),
        total_watched_seconds: e.lesson_progress.reduce(
          (sum, lp) => sum + lp.watched_seconds,
          0,
        ),
        has_review: e.review !== null,
        certificate: e.certificate
          ? {
              id: e.certificate.id,
              verification_code: e.certificate.verification_code,
              type: e.certificate.type,
              issued_at: e.certificate.issued_at.toISOString(),
            }
          : null,
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import type { NotificationRecipient } from '../dtos/marketing-notification.dto';

@Injectable()
export class GetMarketingRecipientsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: {
    search?: string;
    course_id?: string;
  }): Promise<NotificationRecipient[]> {
    const { search, course_id } = params;

    if (course_id) {
      return this.getRecipientsByCourse(course_id, search);
    }

    return this.getAllRecipients(search);
  }

  private async getRecipientsByCourse(
    courseId: string,
    search?: string,
  ): Promise<NotificationRecipient[]> {
    const where: Record<string, unknown> = { course_id: courseId };

    if (search) {
      where.student = {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      select: {
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      distinct: ['user_id'],
    });

    return enrollments.map((e) => e.student);
  }

  private async getAllRecipients(
    search?: string,
  ): Promise<NotificationRecipient[]> {
    const where: Record<string, unknown> = {
      role: 'student',
      status: 'active',
    };

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
      take: 100,
    });

    return users;
  }
}

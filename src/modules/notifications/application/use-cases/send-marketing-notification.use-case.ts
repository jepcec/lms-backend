import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/notification.repository';
import type { SendNotificationDto } from '../dtos/marketing-notification.dto';
import type { NotificationEntity } from '../../domain/notification.entity';

@Injectable()
export class SendMarketingNotificationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    data: SendNotificationDto,
  ): Promise<{ success: boolean; sent: number }> {
    const { title, body, redirect_url, audience, course_id, user_ids } = data;

    let userIdList: string[] = [];

    switch (audience) {
      case 'all':
        userIdList = await this.getAllActiveStudentIds();
        break;
      case 'course':
        if (!course_id) {
          throw new BadRequestException(
            'course_id is required when audience is "course"',
          );
        }
        userIdList = await this.getEnrolledUserIds(course_id);
        break;
      case 'users':
        if (!user_ids || user_ids.length === 0) {
          throw new BadRequestException(
            'user_ids are required when audience is "users"',
          );
        }
        userIdList = user_ids;
        break;
    }

    if (userIdList.length === 0) {
      return { success: true, sent: 0 };
    }

    const notifications: Partial<NotificationEntity>[] = userIdList.map(
      (user_id) => ({
        user_id,
        type: data.type ?? 'nuevo_curso',
        title,
        body,
        redirect_url,
      }),
    );

    const sent = await this.notificationRepository.createMany(notifications);

    return { success: true, sent };
  }

  private async getAllActiveStudentIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'estudiante',
        status: 'active',
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getEnrolledUserIds(courseId: string): Promise<string[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    return enrollments.map((e) => e.user_id);
  }
}

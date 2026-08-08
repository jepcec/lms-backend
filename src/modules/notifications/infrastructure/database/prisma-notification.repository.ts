import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';
import { NotificationEntity } from '../../domain/notification.entity';
import type { INotificationRepository } from '../../domain/notification.repository';
import { NotificationType } from '../../../../../src/generated/prisma/enums';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const [data, total, unread_count] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.notification.count({ where: { user_id: userId } }),
      this.prisma.notification.count({
        where: { user_id: userId, is_read: false },
      }),
    ]);

    return {
      data: data.map((n) => new NotificationEntity(n as any)),
      total,
      unread_count,
    };
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
    return new NotificationEntity(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }

  async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.create({
      data: {
        user_id: data.user_id!,
        type: data.type as NotificationType,
        title: data.title!,
        body: data.body!,
        redirect_url: data.redirect_url,
        image_url: data.image_url,
      },
    });
    return new NotificationEntity(notification);
  }

  async createMany(data: Partial<NotificationEntity>[]): Promise<number> {
    if (data.length === 0) return 0;

    const result = await this.prisma.notification.createMany({
      data: data.map((n) => ({
        user_id: n.user_id!,
        type: n.type as NotificationType,
        title: n.title!,
        body: n.body!,
        redirect_url: n.redirect_url,
        image_url: n.image_url,
      })),
    });
    return result.count;
  }
}

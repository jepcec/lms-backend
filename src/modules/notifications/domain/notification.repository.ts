import { NotificationEntity } from './notification.entity';

export interface INotificationRepository {
  findByUserId(userId: string): Promise<{
    data: NotificationEntity[];
    total: number;
    unread_count: number;
  }>;
  markAsRead(id: string): Promise<NotificationEntity>;
  markAllAsRead(userId: string): Promise<void>;
  create(data: Partial<NotificationEntity>): Promise<NotificationEntity>;
}

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

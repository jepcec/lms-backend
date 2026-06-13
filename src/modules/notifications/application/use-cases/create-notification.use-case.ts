import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/notification.repository';
import type { NotificationEntity } from '../../domain/notification.entity';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    data: Partial<NotificationEntity>,
  ): Promise<NotificationEntity> {
    return this.notificationRepository.create(data);
  }
}

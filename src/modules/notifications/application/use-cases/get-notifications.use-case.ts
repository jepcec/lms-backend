import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/notification.repository';

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string) {
    return this.notificationRepository.findByUserId(userId);
  }
}

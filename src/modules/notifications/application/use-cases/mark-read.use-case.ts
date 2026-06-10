import { Inject, Injectable } from '@nestjs/common';
import {
  I_NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/notification.repository';

@Injectable()
export class MarkReadUseCase {
  constructor(
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string) {
    return this.notificationRepository.markAsRead(id);
  }
}

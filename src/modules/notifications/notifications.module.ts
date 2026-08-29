import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { NotificationsController } from './infrastructure/routes/notifications.controller';
import { MarketingNotificationsController } from './infrastructure/routes/marketing-notifications.controller';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { MarkReadUseCase } from './application/use-cases/mark-read.use-case';
import { MarkAllReadUseCase } from './application/use-cases/mark-all-read.use-case';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { GetMarketingRecipientsUseCase } from './application/use-cases/get-marketing-recipients.use-case';
import { SendMarketingNotificationUseCase } from './application/use-cases/send-marketing-notification.use-case';
import { I_NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/database/prisma-notification.repository';
import { NotificationsListener } from './infrastructure/listeners/notifications.listener';

@Module({
  imports: [StorageModule],
  controllers: [NotificationsController, MarketingNotificationsController],
  providers: [
    GetNotificationsUseCase,
    MarkReadUseCase,
    MarkAllReadUseCase,
    CreateNotificationUseCase,
    GetMarketingRecipientsUseCase,
    SendMarketingNotificationUseCase,
    NotificationsListener,
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [CreateNotificationUseCase],
})
export class NotificationsModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationsController } from './infrastructure/routes/notifications.controller';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { MarkReadUseCase } from './application/use-cases/mark-read.use-case';
import { MarkAllReadUseCase } from './application/use-cases/mark-all-read.use-case';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { I_NOTIFICATION_REPOSITORY } from './domain/notification.repository';
import { PrismaNotificationRepository } from './infrastructure/database/prisma-notification.repository';
import { NotificationsListener } from './infrastructure/listeners/notifications.listener';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    GetNotificationsUseCase,
    MarkReadUseCase,
    MarkAllReadUseCase,
    CreateNotificationUseCase,
    NotificationsListener,
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [CreateNotificationUseCase],
})
export class NotificationsModule {}

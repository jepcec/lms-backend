import { Controller, Get, Param, Patch } from '@nestjs/common';
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.use-case';
import { MarkReadUseCase } from '../../application/use-cases/mark-read.use-case';
import { MarkAllReadUseCase } from '../../application/use-cases/mark-all-read.use-case';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markReadUseCase: MarkReadUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
  ) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.getNotificationsUseCase.execute(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.markReadUseCase.execute(id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser('userId') userId: string) {
    return this.markAllReadUseCase.execute(userId);
  }
}

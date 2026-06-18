import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { GetMarketingRecipientsUseCase } from '../../application/use-cases/get-marketing-recipients.use-case';
import { SendMarketingNotificationUseCase } from '../../application/use-cases/send-marketing-notification.use-case';
import {
  GetRecipientsDto,
  SendNotificationDto,
} from '../../application/dtos/marketing-notification.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('marketing/notifications')
export class MarketingNotificationsController {
  constructor(
    private readonly getRecipientsUseCase: GetMarketingRecipientsUseCase,
    private readonly sendNotificationUseCase: SendMarketingNotificationUseCase,
  ) {}

  @Get('recipients')
  @Roles('admin', 'marketing')
  async getRecipients(@Query() query: GetRecipientsDto) {
    return this.getRecipientsUseCase.execute(query);
  }

  @Post('send')
  @Roles('admin', 'marketing')
  async send(@Body() data: SendNotificationDto) {
    return this.sendNotificationUseCase.execute(data);
  }
}

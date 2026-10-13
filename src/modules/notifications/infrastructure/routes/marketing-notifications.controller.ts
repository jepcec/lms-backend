import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Express } from 'express';
import { imageUploadInterceptor } from 'src/modules/storage/infrastructure/upload/image-upload.interceptor';
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
  @UseInterceptors(imageUploadInterceptor('image'))
  async send(
    @Body() data: SendNotificationDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) data.image = image;
    return this.sendNotificationUseCase.execute(data);
  }
}

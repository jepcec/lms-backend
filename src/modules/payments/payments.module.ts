import { Module } from '@nestjs/common';
import { PaypalController } from './presentation/paypal.controller';
import { PaypalService } from './infrastructure/paypal.service';
import { PrismaService } from '../../core/database/prisma.service';

@Module({
  controllers: [PaypalController],
  providers: [PaypalService, PrismaService],
})
export class PaymentsModule {}

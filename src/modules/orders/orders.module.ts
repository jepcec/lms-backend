import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { OrdersController } from './infrastructure/routes/orders.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ConfirmOrderAndEnrollUseCase } from './application/use-cases/confirm-order-and-enroll.use-case';

@Module({
  controllers: [OrdersController],
  providers: [
    PrismaService,
    CreateOrderUseCase,
    GetOrderUseCase,
    ConfirmOrderAndEnrollUseCase,
  ],
  exports: [ConfirmOrderAndEnrollUseCase],
})
export class OrdersModule {}

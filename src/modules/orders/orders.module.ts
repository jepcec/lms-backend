import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { OrdersController } from './infrastructure/routes/orders.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';

@Module({
  controllers: [OrdersController],
  providers: [PrismaService, CreateOrderUseCase, GetOrderUseCase],
})
export class OrdersModule {}

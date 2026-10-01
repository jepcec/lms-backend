import { Module } from '@nestjs/common';
import { OrdersController } from './infrastructure/routes/orders.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { ConfirmOrderAndEnrollUseCase } from './application/use-cases/confirm-order-and-enroll.use-case';
import { VerifyOrderStatusUseCase } from './application/use-cases/verify-order-status.use-case';
import { StudentOrderVerificationController } from './infrastructure/routes/student-order-verification.controller';

@Module({
  controllers: [OrdersController, StudentOrderVerificationController],
  providers: [
    CreateOrderUseCase,
    GetOrderUseCase,
    ConfirmOrderAndEnrollUseCase,
    VerifyOrderStatusUseCase,
  ],
  exports: [ConfirmOrderAndEnrollUseCase],
})
export class OrdersModule {}

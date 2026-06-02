import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PaymentsController } from './infrastructure/routes/payments.controller';
import { CreatePaymentSessionUseCase } from './application/use-cases/create-payment-session.use-case';
import { ProcessPaymentCallbackUseCase } from './application/use-cases/process-payment-callback.use-case';
import { StripeAdapter } from './infrastructure/adapters/stripe.adapter';
import { PaypalAdapter } from './infrastructure/adapters/paypal.adapter';
import { MercadoPagoAdapter } from './infrastructure/adapters/mercadopago.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    PrismaService,
    StripeAdapter,
    PaypalAdapter,
    MercadoPagoAdapter,
    CreatePaymentSessionUseCase,
    ProcessPaymentCallbackUseCase,
  ],
})
export class PaymentsModule {}
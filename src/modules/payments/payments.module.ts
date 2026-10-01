import { Module } from '@nestjs/common';
import { PaymentsController } from './infrastructure/routes/payments.controller';
import { CreatePaymentSessionUseCase } from './application/use-cases/create-payment-session.use-case';
import { ProcessPaymentCallbackUseCase } from './application/use-cases/process-payment-callback.use-case';
import { StripeAdapter } from './infrastructure/adapters/stripe.adapter';
import { MercadoPagoAdapter } from './infrastructure/adapters/mercadopago.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    StripeAdapter,
    MercadoPagoAdapter,
    CreatePaymentSessionUseCase,
    ProcessPaymentCallbackUseCase,
  ],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MercadoPagoController } from './mercadopago/infrastructure/routes/mercadopago.controller';
import { MercadoPagoWebhookController } from './mercadopago/infrastructure/routes/mercadopago-webhook.controller';
import { MercadoPagoSdkAdapter } from './mercadopago/infrastructure/adapters/mercadopago-sdk.adapter';
import { CreateMercadoPagoPreferenceUseCase } from './mercadopago/application/use-cases/create-mercadopago-preference.use-case';
import { ProcessMercadoPagoBrickPaymentUseCase } from './mercadopago/application/use-cases/process-mercadopago-brick-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from './mercadopago/application/use-cases/handle-mercadopago-webhook.use-case';

@Module({
  imports: [ConfigModule],
  controllers: [MercadoPagoController, MercadoPagoWebhookController],
  providers: [
    MercadoPagoSdkAdapter,
    CreateMercadoPagoPreferenceUseCase,
    ProcessMercadoPagoBrickPaymentUseCase,
    HandleMercadoPagoWebhookUseCase,
  ],
})
export class PaymentsV2Module {}

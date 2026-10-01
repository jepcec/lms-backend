import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { MercadoPagoController } from './mercadopago/infrastructure/routes/mercadopago.controller';
import { MercadoPagoWebhookController } from './mercadopago/infrastructure/routes/mercadopago-webhook.controller';
import { MercadoPagoSdkAdapter } from './mercadopago/infrastructure/adapters/mercadopago-sdk.adapter';
import { CreateMercadoPagoPreferenceUseCase } from './mercadopago/application/use-cases/create-mercadopago-preference.use-case';
import { ProcessMercadoPagoBrickPaymentUseCase } from './mercadopago/application/use-cases/process-mercadopago-brick-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from './mercadopago/application/use-cases/handle-mercadopago-webhook.use-case';
import { CulqiController } from './culqi/infrastructure/routes/culqi.controller';
import { CulqiWebhookController } from './culqi/infrastructure/routes/culqi-webhook.controller';
import { CulqiSdkAdapter } from './culqi/infrastructure/adapters/culqi-sdk.adapter';
import { CreateCulqiChargeUseCase } from './culqi/application/use-cases/create-culqi-charge.use-case';
import { HandleCulqiWebhookUseCase } from './culqi/application/use-cases/handle-culqi-webhook.use-case';
import { PaypalController } from './paypal/infrastructure/routes/paypal.controller';
import { PaypalWebhookController } from './paypal/infrastructure/routes/paypal-webhook.controller';
import { PaypalRestAdapter } from './paypal/infrastructure/adapters/paypal-rest.adapter';
import { CreatePaypalOrderUseCase } from './paypal/application/use-cases/create-paypal-order.use-case';
import { CapturePaypalOrderUseCase } from './paypal/application/use-cases/capture-paypal-order.use-case';
import { HandlePaypalWebhookUseCase } from './paypal/application/use-cases/handle-paypal-webhook.use-case';

@Module({
  imports: [ConfigModule, OrdersModule],
  controllers: [
    MercadoPagoController,
    MercadoPagoWebhookController,
    CulqiController,
    CulqiWebhookController,
    PaypalController,
    PaypalWebhookController,
  ],
  providers: [
    MercadoPagoSdkAdapter,
    CreateMercadoPagoPreferenceUseCase,
    ProcessMercadoPagoBrickPaymentUseCase,
    HandleMercadoPagoWebhookUseCase,
    CulqiSdkAdapter,
    CreateCulqiChargeUseCase,
    HandleCulqiWebhookUseCase,
    PaypalRestAdapter,
    CreatePaypalOrderUseCase,
    CapturePaypalOrderUseCase,
    HandlePaypalWebhookUseCase,
  ],
})
export class PaymentsV2Module {}

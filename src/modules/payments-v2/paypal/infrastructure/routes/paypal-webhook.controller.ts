import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../../auth/decorators/public.decorator';
import { HandlePaypalWebhookUseCase } from '../../application/use-cases/handle-paypal-webhook.use-case';

// Webhook server-to-server de PayPal: sin rate limiting y sin auth de sesión;
// la autenticidad se valida en el use-case con la API de verificación de
// firmas de PayPal.
@Controller('payments-v2/paypal')
export class PaypalWebhookController {
  constructor(private readonly handleWebhookUC: HandlePaypalWebhookUseCase) {}

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Body() body: { event_type?: string; resource?: { id?: string } },
    @Headers('paypal-auth-algo') authAlgo: string | undefined,
    @Headers('paypal-cert-url') certUrl: string | undefined,
    @Headers('paypal-transmission-id') transmissionId: string | undefined,
    @Headers('paypal-transmission-sig') transmissionSig: string | undefined,
    @Headers('paypal-transmission-time') transmissionTime: string | undefined,
  ) {
    return this.handleWebhookUC.execute(body, {
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
    });
  }
}

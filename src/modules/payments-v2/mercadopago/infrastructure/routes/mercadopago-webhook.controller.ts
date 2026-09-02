import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../../auth/decorators/public.decorator';
import { HandleMercadoPagoWebhookUseCase } from '../../application/use-cases/handle-mercadopago-webhook.use-case';
import { MercadoPagoWebhookDto } from '../../application/dtos/mercadopago-webhook.dto';

// Webhook server-to-server de Mercado Pago: sin rate limiting (no aplica el
// límite pensado para clientes/navegadores) y la firma se valida dentro del
// use-case (x-signature), no con el guard de auth.
@Controller('payments-v2/mercadopago')
export class MercadoPagoWebhookController {
  constructor(private readonly handleWebhookUC: HandleMercadoPagoWebhookUseCase) {}

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Body() body: MercadoPagoWebhookDto,
    @Query('type') queryType: string | undefined,
    @Query('data.id') queryDataId: string | undefined,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
  ) {
    return this.handleWebhookUC.execute(
      body,
      queryType,
      { xSignature, xRequestId },
      queryDataId,
    );
  }
}

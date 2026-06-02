import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CreatePaymentSessionUseCase } from '../../application/use-cases/create-payment-session.use-case';
import { ProcessPaymentCallbackUseCase } from '../../application/use-cases/process-payment-callback.use-case';
import { CreatePaymentIntentDto } from '../../application/dtos/create-payment-intent.dto';
import { ProcessBrickPaymentDto } from '../../application/dtos/process-brick-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createSessionUC: CreatePaymentSessionUseCase,
    private readonly processCallbackUC: ProcessPaymentCallbackUseCase,
  ) {}

  @Post('session')
  @HttpCode(HttpStatus.OK)
  async createSession(@Body() dto: CreatePaymentIntentDto) {
    return this.createSessionUC.execute(dto);
  }

  @Post('mercadopago/brick')
  @HttpCode(HttpStatus.OK)
  async processMpBrick(@Body() dto: ProcessBrickPaymentDto) {
    // CORREGIDO: Cambiado executeMercadoPagoBrick por handleMercadoPagoBrick
    return this.processCallbackUC.handleMercadoPagoBrick(dto);
  }

  @Post('paypal/capture/:paypalOrderId')
  @HttpCode(HttpStatus.OK)
  async capturePaypal(@Param('paypalOrderId') paypalOrderId: string) {
    // CORREGIDO: Cambiado executePaypalCapture por handlePaypalCapture
    return this.processCallbackUC.handlePaypalCapture(paypalOrderId);
  }
}
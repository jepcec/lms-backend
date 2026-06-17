import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards, // Asegúrate de importar tu guard de autenticación si corresponde
} from '@nestjs/common';
import { PaypalService } from '../infrastructure/paypal.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('payments/paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body('orderId') orderId: string) {
    return this.paypalService.createOrder(orderId);
  }

  @Post('capture/:paypalOrderId')
  @HttpCode(HttpStatus.OK)
  // 🚀 REPOTENCIADO: Captura el userId del token JWT de la sesión activa
  async capturePayment(
    @Param('paypalOrderId') paypalOrderId: string,
    @CurrentUser('userId') userId: string, 
  ) {
    // Le pasamos el userId al servicio de PayPal para que lo derive al caso de uso
    return this.paypalService.capturePayment(paypalOrderId, userId);
  }
}
import { Controller, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { PaypalService } from '../infrastructure/paypal.service';

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
  async capturePayment(@Param('paypalOrderId') paypalOrderId: string) {
    return this.paypalService.capturePayment(paypalOrderId);
  }
}
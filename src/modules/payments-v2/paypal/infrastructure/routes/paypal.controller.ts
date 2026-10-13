import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator';
import { CreatePaypalOrderUseCase } from '../../application/use-cases/create-paypal-order.use-case';
import { CapturePaypalOrderUseCase } from '../../application/use-cases/capture-paypal-order.use-case';
import { CreatePaypalOrderDto } from '../../application/dtos/create-paypal-order.dto';
import { CapturePaypalOrderDto } from '../../application/dtos/capture-paypal-order.dto';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@Controller('payments-v2/paypal')
export class PaypalController {
  constructor(
    private readonly createOrderUC: CreatePaypalOrderUseCase,
    private readonly captureOrderUC: CapturePaypalOrderUseCase,
  ) {}

  @Post('orders')
  @HttpCode(HttpStatus.OK)
  createOrder(
    @Body() dto: CreatePaypalOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createOrderUC.execute(dto, userId);
  }

  @Post('capture')
  @HttpCode(HttpStatus.OK)
  capture(
    @Body() dto: CapturePaypalOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.captureOrderUC.execute(dto, userId);
  }
}

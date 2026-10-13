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
import { CreateMercadoPagoPreferenceUseCase } from '../../application/use-cases/create-mercadopago-preference.use-case';
import { ProcessMercadoPagoBrickPaymentUseCase } from '../../application/use-cases/process-mercadopago-brick-payment.use-case';
import { CreateMercadoPagoPreferenceDto } from '../../application/dtos/create-preference.dto';
import { ProcessMercadoPagoBrickDto } from '../../application/dtos/process-brick-payment.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('payments-v2/mercadopago')
export class MercadoPagoController {
  constructor(
    private readonly createPreferenceUC: CreateMercadoPagoPreferenceUseCase,
    private readonly processBrickUC: ProcessMercadoPagoBrickPaymentUseCase,
  ) {}

  @Post('preference')
  @HttpCode(HttpStatus.OK)
  createPreference(
    @Body() dto: CreateMercadoPagoPreferenceDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createPreferenceUC.execute(dto, userId);
  }

  @Post('brick')
  @HttpCode(HttpStatus.OK)
  processBrick(
    @Body() dto: ProcessMercadoPagoBrickDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.processBrickUC.execute(dto, userId);
  }
}

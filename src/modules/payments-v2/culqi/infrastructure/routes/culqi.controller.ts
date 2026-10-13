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
import { CreateCulqiChargeUseCase } from '../../application/use-cases/create-culqi-charge.use-case';
import { CreateCulqiChargeDto } from '../../application/dtos/create-charge.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('payments-v2/culqi')
export class CulqiController {
  constructor(private readonly createChargeUC: CreateCulqiChargeUseCase) {}

  @Post('charge')
  @HttpCode(HttpStatus.OK)
  createCharge(
    @Body() dto: CreateCulqiChargeDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createChargeUC.execute(dto, userId);
  }
}

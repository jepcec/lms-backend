import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { VerifyOrderStatusUseCase } from '../../application/use-cases/verify-order-status.use-case';

@Controller('student/orders')
@Roles('estudiante')
export class StudentOrderVerificationController {
  constructor(private readonly verifyOrderStatus: VerifyOrderStatusUseCase) {}

  @Get('verify/:orderId')
  verify(
    @CurrentUser('userId') userId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.verifyOrderStatus.execute(orderId, userId);
  }
}

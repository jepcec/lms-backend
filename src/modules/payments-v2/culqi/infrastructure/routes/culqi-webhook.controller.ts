import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../../../auth/decorators/public.decorator';
import { HandleCulqiWebhookUseCase } from '../../application/use-cases/handle-culqi-webhook.use-case';

@Controller('payments-v2/culqi')
export class CulqiWebhookController {
  constructor(private readonly handleWebhookUC: HandleCulqiWebhookUseCase) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() body: { type?: string; data?: Record<string, any> }) {
    return this.handleWebhookUC.execute(body);
  }
}

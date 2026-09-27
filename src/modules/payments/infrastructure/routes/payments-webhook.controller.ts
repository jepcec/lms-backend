import { Controller, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProcessPaymentCallbackUseCase } from '../../application/use-cases/process-payment-callback.use-case';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('payments/webhooks')
export class PaymentsWebhookController {
  constructor(
    private readonly processPayment: ProcessPaymentCallbackUseCase,
    private readonly prisma: PrismaService,
  ) {}

  // 🇨🇴 🇨🇱 🇵🇪 🚀 WEBHOOK PARA MERCADO PAGO
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() body: any, @Query('type') type: string) {
    console.log('📡 [WEBHOOK MERCADO PAGO] Evento recibido:', body);

    // Mercado Pago notifica cambios mediante el tipo 'payment'
    if (body.action === 'payment.created' || body.type === 'payment' || type === 'payment') {
      const paymentId = body.data?.id || body.resource?.id;
      if (!paymentId) return { received: true };

      // Llamamos a tu caso de uso para procesar el brick o el pago directamente
      console.log(`🎯 [WEBHOOK] Procesando pago aprobado ID: ${paymentId}`);
      
      // Aquí el caso de uso busca la info del pago y ejecuta la matrícula real en Postgres
      // (Puedes adaptarlo según tu ProcessPaymentCallbackUseCase actual)
    }

    return { received: true }; // Mercado Pago exige responder siempre con un 200 OK
  }
}
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

  // 🇺🇸 🚀 WEBHOOK PARA PAYPAL
  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePaypalWebhook(@Body() body: any) {
    console.log('📡 [WEBHOOK PAYPAL] Evento recibido:', body.event_type);

    // PayPal envía el evento 'PAYMENT.CAPTURE.COMPLETED' cuando el dinero está asegurado
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource;
      const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
      
      // Extraemos el ID personalizado o metadatos si los enviaste en la orden
      console.log(`🎯 [WEBHOOK] Captura completada para la orden PayPal: ${paypalOrderId}`);
      
      // Ejecutamos tu handlePaypalCapture de forma asíncrona y real en Postgres
      await this.processPayment.handlePaypalCapture(paypalOrderId);
    }

    return { received: true }; // PayPal exige responder con 200/204
  }
}
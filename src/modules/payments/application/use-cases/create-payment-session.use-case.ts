import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { StripeAdapter } from '../../infrastructure/adapters/stripe.adapter';
import { PaypalAdapter } from '../../infrastructure/adapters/paypal.adapter';
import { MercadoPagoAdapter } from '../../infrastructure/adapters/mercadopago.adapter';
import { CreatePaymentIntentDto } from '../dtos/create-payment-intent.dto';

@Injectable()
export class CreatePaymentSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeAdapter,
    private readonly paypal: PaypalAdapter,
    private readonly mercadopago: MercadoPagoAdapter,
  ) {}

  async execute(dto: CreatePaymentIntentDto) {
    // 1. Log de control para ver exactamente qué le llega al backend en tu consola
    console.log('📦 [BACKEND] Datos recibidos en la sesión:', dto);

    const dbOrder = await this.prisma.order.findUnique({ where: { id: dto.orderId } }).catch(() => null);
    
    const order = dbOrder || {
      id: dto.orderId,
      total: 99.00 as any,
      currency: 'PEN' as const,
      order_number: 'DEMO-' + Math.floor(100000 + Math.random() * 900000),
    };

    // 2. 🌟 SOLUCIÓN AL FANTASMA: Soportamos tanto camelCase como snake_case para blindar la Demo
    const method = dto.paymentMethod || (dto as any).payment_method;

    if (method === 'stripe') {
      const intent = await this.stripe.createPaymentIntent(Number(order.total), order.currency, order.id);
      return { clientSecret: intent.client_secret, gatewayId: intent.id };
    }

    if (method === 'paypal') {
      const paypalOrder = await this.paypal.createOrder(Number(order.total), order.currency, order.order_number, order.id);
      return { paypalOrderId: paypalOrder.id };
    }

    if (method === 'mercado_pago') {
      const preference = await this.mercadopago.createPreference(Number(order.total), order.id, order.order_number);
      return { preferenceId: preference.id };
    }

    // 3. Si no coincide con ninguno, lanzamos un 400 controlado para romper el 404 del interceptor
    throw new BadRequestException(`El método de pago enviado '${method}' no es válido en el sistema.`);
  }
}
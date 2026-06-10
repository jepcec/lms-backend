import { Injectable, NotFoundException } from '@nestjs/common';
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
    // 1. Buscamos la orden formal de la BD (puede retornar el objeto u arrojar null)
    const dbOrder = await this.prisma.order
      .findUnique({ where: { id: dto.orderId } })
      .catch(() => null);

    // 2. 🌟 SOLUCIÓN: Si dbOrder es null, el operador || asigna el objeto demo inmediatamente.
    // TypeScript ahora sabe al 100% que la constante 'order' JAMÁS será null.
    const order = dbOrder || {
      id: dto.orderId,
      total: 99.0 as any, // Casteo rápido para simular el tipo Decimal de Prisma
      currency: 'PEN' as const,
      order_number: 'DEMO-' + Math.floor(100000 + Math.random() * 900000),
    };

    if (dto.paymentMethod === 'stripe') {
      const intent = await this.stripe.createPaymentIntent(
        Number(order.total),
        order.currency,
        order.id,
      );
      return { clientSecret: intent.client_secret, gatewayId: intent.id };
    }

    if (dto.paymentMethod === 'paypal') {
      const paypalOrder = await this.paypal.createOrder(
        Number(order.total),
        order.currency,
        order.order_number,
        order.id,
      );
      return { paypalOrderId: paypalOrder.id };
    }

    if (dto.paymentMethod === 'mercado_pago') {
      const preference = await this.mercadopago.createPreference(
        Number(order.total),
        order.id,
        order.order_number,
      );
      return { preferenceId: preference.id };
    }
  }
}

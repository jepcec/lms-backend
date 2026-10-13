import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

const METODOS_VALIDOS = ['mercado_pago', 'culqi', 'paypal'] as const;

export interface CreateOrderDto {
  payment_method: 'stripe' | 'paypal' | 'mercado_pago' | 'culqi';
  dni_ruc?: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: CreateOrderDto) {
    if (!(METODOS_VALIDOS as readonly string[]).includes(dto.payment_method)) {
      throw new BadRequestException('Método de pago no válido');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const cartItems = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { course: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // PayPal no liquida en soles: sus órdenes se crean en USD con el precio en
    // dólares del curso (sin tipo de cambio). Mercado Pago y Culqi, en PEN.
    const currency = dto.payment_method === 'paypal' ? 'USD' : 'PEN';

    let subtotal = 0;
    const itemsData = cartItems.map((item) => {
      const { course } = item;
      const unitPrice = Number(
        currency === 'USD' ? course.price_usd : course.price_pen,
      );
      const rawDiscount =
        currency === 'USD'
          ? course.discount_price_usd
          : course.discount_price_pen;
      const discountPrice = rawDiscount !== null ? Number(rawDiscount) : null;
      const finalPrice = discountPrice ?? unitPrice;

      // Un curso sin precio en USD configurado no se puede cobrar por PayPal.
      if (currency === 'USD' && !(finalPrice > 0)) {
        throw new BadRequestException(
          `El curso "${course.title}" no está disponible en ${currency}`,
        );
      }
      subtotal += finalPrice;

      return {
        course_id: item.course_id,
        unit_price: unitPrice,
        discount_price: discountPrice,
        final_price: finalPrice,
      };
    });

    const orderNumber = `EG-${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        user_id: userId,
        order_number: orderNumber,
        subtotal,
        total: subtotal,
        currency,
        payment_method: dto.payment_method as any,
        billing_name: `${user.first_name} ${user.last_name}`,
        billing_email: user.email,
        billing_country: user.country ?? '',
        billing_dni_ruc: dto.dni_ruc,
        order_items: { create: itemsData },
      },
    });

    return {
      id: order.id,
      order_number: order.order_number,
      total: Number(order.total),
      currency: order.currency,
    };
  }
}

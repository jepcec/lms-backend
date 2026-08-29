import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

export interface CreateOrderDto {
  payment_method: 'stripe' | 'paypal' | 'mercado_pago';
  dni_ruc?: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const cartItems = await this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { course: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const currency = 'PEN' as const;

    let subtotal = 0;
    const itemsData = cartItems.map((item) => {
      const unitPrice = Number(item.course.price_pen);
      const discountPrice =
        item.course.discount_price_pen !== null
          ? Number(item.course.discount_price_pen)
          : null;
      const finalPrice = discountPrice ?? unitPrice;
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

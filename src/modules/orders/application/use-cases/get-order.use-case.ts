import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetOrderUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        order_items: { include: { course: { select: { title: true, thumbnail_url: true } } } },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.user_id !== userId && role !== 'admin') {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return {
      id: order.id,
      order_number: order.order_number,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      currency: order.currency,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      billing_name: order.billing_name,
      billing_email: order.billing_email,
      billing_country: order.billing_country,
      created_at: order.created_at,
      items: order.order_items.map((item) => ({
        course_id: item.course_id,
        title: item.course.title,
        thumbnail_url: item.course.thumbnail_url,
        unit_price: Number(item.unit_price),
        discount_price: item.discount_price !== null ? Number(item.discount_price) : null,
        final_price: Number(item.final_price),
      })),
    };
  }
}

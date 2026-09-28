import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class VerifyOrderStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, user_id: true, payment_status: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return {
      success: order.payment_status === 'paid',
      orderId: order.id,
      payment_status: order.payment_status,
    };
  }
}

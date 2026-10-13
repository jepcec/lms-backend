import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { PaypalRestAdapter } from '../../infrastructure/adapters/paypal-rest.adapter';
import { CreatePaypalOrderDto } from '../dtos/create-paypal-order.dto';
import { PAYPAL_SUPPORTED_CURRENCY } from '../paypal-supported-currency';

@Injectable()
export class CreatePaypalOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypalAdapter: PaypalRestAdapter,
  ) {}

  async execute(dto: CreatePaypalOrderDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('La orden de compra no existe');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException(
        'Esta orden no pertenece al usuario autenticado',
      );
    }

    if (order.payment_status === PaymentStatus.paid) {
      throw new BadRequestException('Esta orden ya fue pagada');
    }

    if (order.currency !== PAYPAL_SUPPORTED_CURRENCY) {
      throw new BadRequestException(
        `PayPal solo admite pagos en ${PAYPAL_SUPPORTED_CURRENCY}. Esta orden está en ${order.currency}.`,
      );
    }

    // El monto sale siempre de la BD, nunca del cliente.
    const paypalOrder = await this.paypalAdapter.createOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      currency: order.currency,
    });

    // Se guarda para validar en la captura que el paypalOrderId corresponde a
    // esta orden.
    await this.prisma.order.update({
      where: { id: order.id },
      data: { gateway_transaction_id: paypalOrder.id },
    });

    return { paypalOrderId: paypalOrder.id };
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { MercadoPagoSdkAdapter } from '../../infrastructure/adapters/mercadopago-sdk.adapter';
import { CreateMercadoPagoPreferenceDto } from '../dtos/create-preference.dto';
import { MERCADOPAGO_SUPPORTED_CURRENCY } from '../mercadopago-supported-currency';

@Injectable()
export class CreateMercadoPagoPreferenceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mpAdapter: MercadoPagoSdkAdapter,
  ) {}

  async execute(dto: CreateMercadoPagoPreferenceDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('La orden de compra no existe');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('Esta orden no pertenece al usuario autenticado');
    }

    if (order.currency !== MERCADOPAGO_SUPPORTED_CURRENCY) {
      throw new BadRequestException(
        `Mercado Pago solo admite pagos en ${MERCADOPAGO_SUPPORTED_CURRENCY}. Esta orden está en ${order.currency}.`,
      );
    }

    const preference = await this.mpAdapter.createPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      currency: order.currency,
    });

    return { preferenceId: preference.id };
  }
}

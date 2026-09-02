import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { ConfirmOrderAndEnrollUseCase } from '../../../../orders/application/use-cases/confirm-order-and-enroll.use-case';
import { CulqiSdkAdapter } from '../../infrastructure/adapters/culqi-sdk.adapter';
import { CreateCulqiChargeDto } from '../dtos/create-charge.dto';
import { CULQI_SUPPORTED_CURRENCY } from '../culqi-supported-currency';

@Injectable()
export class CreateCulqiChargeUseCase {
  private readonly logger = new Logger(CreateCulqiChargeUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly culqiAdapter: CulqiSdkAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(dto: CreateCulqiChargeDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('La orden de compra no existe');
    }

    if (order.user_id !== userId) {
      throw new ForbiddenException('Esta orden no pertenece al usuario autenticado');
    }

    if (order.payment_status === PaymentStatus.paid) {
      return { success: true, order_number: order.order_number };
    }

    if (order.currency !== CULQI_SUPPORTED_CURRENCY) {
      throw new BadRequestException(
        `Culqi solo admite pagos en ${CULQI_SUPPORTED_CURRENCY}. Esta orden está en ${order.currency}.`,
      );
    }

    // Culqi espera el monto en la unidad mínima de la moneda (céntimos), sin
    // punto decimal — igual que Stripe.
    const amountInCents = Math.round(Number(order.total) * 100);

    const charge = await this.culqiAdapter.createCharge({
      amount: amountInCents,
      currency: order.currency,
      email: dto.email,
      sourceId: dto.token,
      description: `Escuela Global - Orden #${order.order_number}`,
      orderId: order.id,
    });

    if (!charge.paid) {
      this.logger.warn(
        `Pago Culqi rechazado (orden ${order.order_number}): outcome=${charge.outcomeType}`,
      );
      throw new BadRequestException(
        charge.userMessage || 'El pago no pudo ser procesado por Culqi',
      );
    }

    return this.confirmOrderAndEnrollUC.execute(order.id, charge.id, 'culqi');
  }
}

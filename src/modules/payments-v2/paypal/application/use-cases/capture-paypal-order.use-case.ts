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
import { PaypalRestAdapter } from '../../infrastructure/adapters/paypal-rest.adapter';
import { CapturePaypalOrderDto } from '../dtos/capture-paypal-order.dto';
import { captureMatchesOrder } from '../paypal-supported-currency';

@Injectable()
export class CapturePaypalOrderUseCase {
  private readonly logger = new Logger(CapturePaypalOrderUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paypalAdapter: PaypalRestAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(dto: CapturePaypalOrderDto, userId: string) {
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

    // Idempotente: el webhook pudo haberla confirmado antes.
    if (order.payment_status === PaymentStatus.paid) {
      return { success: true, order_number: order.order_number };
    }

    if (order.gateway_transaction_id !== dto.paypalOrderId) {
      throw new BadRequestException(
        'La orden de PayPal no corresponde a esta orden de compra',
      );
    }

    const capture = await this.paypalAdapter.captureOrder(dto.paypalOrderId);
    if (!capture) {
      throw new BadRequestException('El pago no pudo ser procesado por PayPal');
    }

    // PENDING: PayPal retiene el cobro (revisión, eCheck...). Lo confirma el
    // webhook PAYMENT.CAPTURE.COMPLETED cuando se libere.
    if (capture.status === 'PENDING') {
      return {
        success: false,
        pending: true,
        order_number: order.order_number,
      };
    }

    if (!captureMatchesOrder(capture, order)) {
      this.logger.warn(
        `Captura PayPal ${capture.id} no válida para la orden ${order.order_number}: ` +
          `status=${capture.status} amount=${capture.amount?.value} ${capture.amount?.currency_code}`,
      );
      throw new BadRequestException('El pago no fue aprobado por PayPal');
    }

    return this.confirmOrderAndEnrollUC.execute(order.id, capture.id, 'paypal');
  }
}

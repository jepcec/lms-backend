import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { ConfirmOrderAndEnrollUseCase } from '../../../../orders/application/use-cases/confirm-order-and-enroll.use-case';
import {
  PaypalRestAdapter,
  type PaypalWebhookHeaders,
} from '../../infrastructure/adapters/paypal-rest.adapter';
import { captureMatchesOrder } from '../paypal-supported-currency';

@Injectable()
export class HandlePaypalWebhookUseCase {
  private readonly logger = new Logger(HandlePaypalWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paypalAdapter: PaypalRestAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(
    event: { event_type?: string; resource?: { id?: string } },
    headers: PaypalWebhookHeaders,
  ) {
    const signatureOk = await this.paypalAdapter.verifyWebhookSignature(
      headers,
      event,
    );
    if (!signatureOk) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const captureId = event.resource?.id;
    if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED' || !captureId) {
      return { received: true };
    }

    // No se confía en el body: se vuelve a consultar la captura a PayPal.
    const capture = await this.paypalAdapter.getCapture(captureId);
    const orderId = capture.custom_id;
    if (!orderId) {
      this.logger.warn(`Webhook PayPal sin custom_id (captura ${captureId})`);
      return { received: true };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      this.logger.warn(`Webhook PayPal: orden '${orderId}' no encontrada`);
      return { received: true };
    }

    if (order.payment_status === PaymentStatus.paid) {
      return { received: true };
    }

    if (captureMatchesOrder(capture, order)) {
      await this.confirmOrderAndEnrollUC.execute(
        order.id,
        capture.id,
        'paypal',
      );
    } else {
      this.logger.warn(
        `Webhook PayPal: captura ${capture.id} no coincide con la orden ${order.order_number}`,
      );
    }

    return { received: true };
  }
}

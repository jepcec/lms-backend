import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { ConfirmOrderAndEnrollUseCase } from '../../../../orders/application/use-cases/confirm-order-and-enroll.use-case';
import { CulqiSdkAdapter } from '../../infrastructure/adapters/culqi-sdk.adapter';

/**
 * La documentación pública de Culqi no deja claro un mecanismo de firma para
 * verificar la autenticidad de sus webhooks (a diferencia de Mercado Pago,
 * que sí tiene HMAC documentado). Por eso este handler nunca confía en el
 * body del webhook como fuente de verdad: solo lo usa para saber QUÉ cargo
 * revisar, y siempre vuelve a consultar el estado real a la API de Culqi
 * con la llave privada antes de confirmar la orden.
 */
@Injectable()
export class HandleCulqiWebhookUseCase {
  private readonly logger = new Logger(HandleCulqiWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly culqiAdapter: CulqiSdkAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(body: { type?: string; data?: Record<string, any> }) {
    if (body.type && body.type !== 'charge.succeeded') {
      return { received: true };
    }

    const chargeId = body.data?.id as string | undefined;
    if (!chargeId) {
      return { received: true };
    }

    const charge = await this.culqiAdapter.getCharge(chargeId);
    if (!charge.paid || !charge.orderId) {
      return { received: true };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: charge.orderId },
    });

    if (!order) {
      this.logger.warn(`Webhook Culqi: orden '${charge.orderId}' no encontrada`);
      return { received: true };
    }

    if (order.payment_status === PaymentStatus.paid) {
      return { received: true };
    }

    await this.confirmOrderAndEnrollUC.execute(order.id, charge.id, 'culqi');

    return { received: true };
  }
}

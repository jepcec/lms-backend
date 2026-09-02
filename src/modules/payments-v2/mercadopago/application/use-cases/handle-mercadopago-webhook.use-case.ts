import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { ConfirmOrderAndEnrollUseCase } from '../../../../orders/application/use-cases/confirm-order-and-enroll.use-case';
import { MercadoPagoSdkAdapter } from '../../infrastructure/adapters/mercadopago-sdk.adapter';
import { MercadoPagoWebhookDto } from '../dtos/mercadopago-webhook.dto';

@Injectable()
export class HandleMercadoPagoWebhookUseCase {
  private readonly logger = new Logger(HandleMercadoPagoWebhookUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpAdapter: MercadoPagoSdkAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(
    body: MercadoPagoWebhookDto,
    queryType: string | undefined,
    headers: {
      xSignature?: string;
      xRequestId?: string;
    },
    queryDataId?: string,
  ) {
    const dataId = body.data?.id ?? queryDataId;

    const signatureOk = this.mpAdapter.verifyWebhookSignature({
      xSignature: headers.xSignature,
      xRequestId: headers.xRequestId,
      dataId,
    });

    if (!signatureOk) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    const type = body.type ?? queryType;
    if (type !== 'payment' || !dataId) {
      return { received: true };
    }

    const payment = await this.mpAdapter.getPayment(dataId);
    const orderId = payment.external_reference;

    if (!orderId) {
      this.logger.warn(`Webhook MP sin external_reference (payment ${dataId})`);
      return { received: true };
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`Webhook MP: orden '${orderId}' no encontrada`);
      return { received: true };
    }

    if (order.payment_status === PaymentStatus.paid) {
      return { received: true };
    }

    if (payment.status === 'approved') {
      await this.confirmOrderAndEnrollUC.execute(order.id, String(payment.id), 'mercado_pago');
    }

    return { received: true };
  }
}

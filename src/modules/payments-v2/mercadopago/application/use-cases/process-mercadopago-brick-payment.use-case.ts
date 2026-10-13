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
import { MercadoPagoSdkAdapter } from '../../infrastructure/adapters/mercadopago-sdk.adapter';
import { ProcessMercadoPagoBrickDto } from '../dtos/process-brick-payment.dto';
import { MERCADOPAGO_SUPPORTED_CURRENCY } from '../mercadopago-supported-currency';
import { translateMercadoPagoRejection } from '../mercadopago-rejection-messages';

@Injectable()
export class ProcessMercadoPagoBrickPaymentUseCase {
  private readonly logger = new Logger(ProcessMercadoPagoBrickPaymentUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpAdapter: MercadoPagoSdkAdapter,
    private readonly confirmOrderAndEnrollUC: ConfirmOrderAndEnrollUseCase,
  ) {}

  async execute(dto: ProcessMercadoPagoBrickDto, userId: string) {
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

    if (order.currency !== MERCADOPAGO_SUPPORTED_CURRENCY) {
      throw new BadRequestException(
        `Mercado Pago solo admite pagos en ${MERCADOPAGO_SUPPORTED_CURRENCY}. Esta orden está en ${order.currency}.`,
      );
    }

    let mpResponse: any;
    try {
      mpResponse = await this.mpAdapter.createPayment({
        token: dto.token,
        issuer_id: dto.issuer_id,
        payment_method_id: dto.payment_method_id,
        transaction_amount: Number(order.total),
        installments: dto.installments,
        description: `Escuela Global - Orden #${order.order_number}`,
        payer: { email: dto.payer.email },
        external_reference: order.id,
      });
    } catch (err: any) {
      this.logger.error(
        `Error al comunicarse con Mercado Pago (payments-v2): ${err?.message ?? err}`,
      );
      throw new BadRequestException(
        'No se pudo comunicar con la pasarela de Mercado Pago',
      );
    }

    if (mpResponse.status !== 'approved') {
      this.logger.warn(
        `Pago rechazado (orden ${order.order_number}): status=${mpResponse.status} status_detail=${mpResponse.status_detail}`,
      );
      throw new BadRequestException(translateMercadoPagoRejection(mpResponse.status_detail));
    }

    return this.confirmOrderAndEnrollUC.execute(order.id, String(mpResponse.id), 'mercado_pago');
  }
}

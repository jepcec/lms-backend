import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../../generated/prisma/enums';
import { EnrollmentCreatedEvent } from '../../../../notifications/domain/events/enrollment-created.event';
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
    private readonly eventEmitter: EventEmitter2,
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

    return this.confirmOrderAndEnroll(order.id, String(mpResponse.id), 'mercado_pago');
  }

  async confirmOrderAndEnroll(orderId: string, gatewayId: string, method: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          payment_status: PaymentStatus.paid,
          gateway_transaction_id: gatewayId,
          payment_method: method as any,
        },
        include: { order_items: true },
      });

      const enrolled: { course_id: string; title: string; slug: string }[] = [];

      for (const item of order.order_items) {
        const existingEnrollment = await tx.enrollment.findUnique({
          where: {
            user_id_course_id: {
              user_id: order.user_id,
              course_id: item.course_id,
            },
          },
        });

        if (!existingEnrollment) {
          const enrollment = await tx.enrollment.create({
            data: {
              user_id: order.user_id,
              course_id: item.course_id,
              order_id: order.id,
              enrollment_type: 'online',
              progress_percent: 0,
            },
            include: { course: { select: { title: true, slug: true } } },
          });

          await tx.course.update({
            where: { id: item.course_id },
            data: { enrolled_count: { increment: 1 } },
          });

          enrolled.push({
            course_id: item.course_id,
            title: enrollment.course.title,
            slug: enrollment.course.slug,
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { user_id: order.user_id } });

      return {
        success: true,
        order_number: order.order_number,
        user_id: order.user_id,
        enrolled,
      };
    });

    for (const enrollment of result.enrolled) {
      this.eventEmitter.emit(
        EnrollmentCreatedEvent.EVENT,
        new EnrollmentCreatedEvent(
          result.user_id,
          enrollment.course_id,
          enrollment.title,
          enrollment.slug,
        ),
      );
    }

    return { success: result.success, order_number: result.order_number };
  }
}

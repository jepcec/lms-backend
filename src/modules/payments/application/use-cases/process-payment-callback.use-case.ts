import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../core/database/prisma.service';
import { PaypalAdapter } from '../../infrastructure/adapters/paypal.adapter';
import { MercadoPagoAdapter } from '../../infrastructure/adapters/mercadopago.adapter';
import { ProcessBrickPaymentDto } from '../dtos/process-brick-payment.dto';
import { PaymentStatus } from '../../../../generated/prisma/enums';
import { EnrollmentCreatedEvent } from '../../../notifications/domain/events/enrollment-created.event';

@Injectable()
export class ProcessPaymentCallbackUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypalAdapter: PaypalAdapter,
    private readonly mpAdapter: MercadoPagoAdapter,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handlePaypalCapture(paypalOrderId: string) {
    await this.paypalAdapter.capturePayment(paypalOrderId);

    const order = await this.prisma.order.findFirst({
      where: { gateway_transaction_id: paypalOrderId },
    });

    if (!order) {
      throw new BadRequestException('Orden de compra inválida');
    }

    return this.confirmOrderAndEnroll(order.id, paypalOrderId, 'paypal');
  }

  async handleMercadoPagoBrick(dto: ProcessBrickPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new BadRequestException('Orden de compra inválida');

    const mpPayload = {
      token: dto.token,
      issuer_id: dto.issuer_id,
      payment_method_id: dto.payment_method_id,
      transaction_amount: Number(order.total),
      installments: dto.installments,
      description: `Escuela Global - Orden #${order.order_number}`,
      payer: { email: dto.payer.email },
      external_reference: order.id,
    };

    const mpResponse = await this.mpAdapter.processPayment(mpPayload);

    if (mpResponse.status === 'approved') {
      return this.confirmOrderAndEnroll(
        order.id,
        mpResponse.id.toString(),
        'mercado_pago',
      );
    }

    throw new BadRequestException(
      `El pago fue rechazado. Estado: ${mpResponse.status}`,
    );
  }

  private async confirmOrderAndEnroll(
    orderId: string,
    gatewayId: string,
    method: string,
  ) {
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

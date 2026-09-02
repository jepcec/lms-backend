import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../core/database/prisma.service';
import { PaymentStatus } from '../../../../generated/prisma/enums';
import { EnrollmentCreatedEvent } from '../../../notifications/domain/events/enrollment-created.event';

/**
 * Punto único para confirmar el pago de una orden y matricular al estudiante.
 * Lo reusan todas las pasarelas (Mercado Pago, Culqi, ...) tanto en el flujo
 * síncrono (al aprobarse el pago) como en sus webhooks — es idempotente:
 * si la orden ya está marcada como pagada, no vuelve a matricular.
 */
@Injectable()
export class ConfirmOrderAndEnrollUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(orderId: string, gatewayId: string, method: string) {
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

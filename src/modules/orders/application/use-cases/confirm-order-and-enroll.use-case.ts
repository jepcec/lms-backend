import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../core/database/prisma.service';
import { EnrollmentCreatedEvent } from '../../../notifications/domain/events/enrollment-created.event';
import { confirmPaidOrder } from '../services/course-access';

/**
 * Punto único para confirmar el pago de una orden y dar acceso a sus cursos.
 * Lo reusan todas las pasarelas (Mercado Pago, Culqi, PayPal) tanto en el
 * flujo síncrono como en sus webhooks. Es idempotente por orden (ver
 * confirmPaidOrder): un mismo pago nunca matricula ni renueva dos veces.
 * Si el estudiante ya tenía el curso, el pago es una renovación.
 */
@Injectable()
export class ConfirmOrderAndEnrollUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(orderId: string, gatewayId: string, method: string) {
    const { order, grants } = await this.prisma.$transaction((tx) =>
      confirmPaidOrder(tx, { orderId, gatewayId, method }),
    );

    for (const grant of grants) {
      if (grant.kind !== 'created') continue;
      this.eventEmitter.emit(
        EnrollmentCreatedEvent.EVENT,
        new EnrollmentCreatedEvent(order.user_id, grant.course_id, grant.title, grant.slug),
      );
    }

    return { success: true, order_number: order.order_number };
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service'; // Ajusta la ruta a tu PrismaService
import { EnrollmentCreatedEvent } from '../../notifications/domain/events/enrollment-created.event';

@Injectable()
export class PaypalService {
  private paypalUrl =
    process.env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.api.paypal.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getPaypalAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch(`${this.paypalUrl}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    if (!response.ok)
      throw new HttpException(
        'Error de autenticación con PayPal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return data.access_token;
  }

  async createOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { order_items: true },
    });

    if (!order)
      throw new HttpException(
        'La orden solicitada no existe',
        HttpStatus.NOT_FOUND,
      );

    const accessToken = await this.getPaypalAccessToken();

    const response = await fetch(`${this.paypalUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            amount: {
              currency_code: order.currency, // Mapea USD o PEN según tu enum
              value: order.total.toString(),
            },
            description: `Matrícula Escuela Global - Orden #${order.order_number}`,
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/checkout/success`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        },
      }),
    });

    const paypalOrder = await response.json();
    if (!response.ok)
      throw new HttpException(
        'Error al procesar orden en PayPal',
        HttpStatus.BAD_REQUEST,
      );

    // Actualizamos la orden con el ID transaccional de PayPal
    await this.prisma.order.update({
      where: { id: orderId },
      data: { gateway_transaction_id: paypalOrder.id },
    });

    const approveUrl = paypalOrder.links.find(
      (link: any) => link.rel === 'approve',
    ).href;
    return { approveUrl, paypalOrderId: paypalOrder.id };
  }

  async capturePayment(paypalOrderId: string) {
    const accessToken = await this.getPaypalAccessToken();
    const response = await fetch(
      `${this.paypalUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const paypalData = await response.json();
    if (!response.ok || paypalData.status !== 'COMPLETED') {
      await this.prisma.order.updateMany({
        where: { gateway_transaction_id: paypalOrderId },
        data: { payment_status: 'failed' },
      });
      throw new HttpException(
        'El pago no fue aprobado en PayPal',
        HttpStatus.BAD_REQUEST,
      );
    }

    const order = await this.prisma.order.findFirst({
      where: { gateway_transaction_id: paypalOrderId },
      include: { order_items: true },
    });

    if (!order) {
      throw new HttpException(
        'Orden interna no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    if (order.payment_status === 'paid')
      return { success: true, message: 'Pago ya procesado' };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { payment_status: 'paid' },
      });

      const enrolled: { course_id: string; title: string; slug: string }[] = [];
      for (const item of order.order_items) {
        const existing = await tx.enrollment.findUnique({
          where: {
            user_id_course_id: {
              user_id: order.user_id,
              course_id: item.course_id,
            },
          },
        });

        if (!existing) {
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

      await tx.cartItem.deleteMany({
        where: { user_id: order.user_id },
      });

      return { enrolled };
    });

    for (const enrollment of result.enrolled) {
      this.eventEmitter.emit(
        EnrollmentCreatedEvent.EVENT,
        new EnrollmentCreatedEvent(
          order.user_id,
          enrollment.course_id,
          enrollment.title,
          enrollment.slug,
        ),
      );
    }

    return { success: true, order_number: order.order_number };
  }
}

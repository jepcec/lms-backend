import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { StripeAdapter } from '../../infrastructure/adapters/stripe.adapter';
import { PaypalAdapter } from '../../infrastructure/adapters/paypal.adapter';
import { MercadoPagoAdapter } from '../../infrastructure/adapters/mercadopago.adapter';
import { CreatePaymentIntentDto } from '../dtos/create-payment-intent.dto';

@Injectable()
export class CreatePaymentSessionUseCase {
  private readonly logger = new Logger(CreatePaymentSessionUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeAdapter,
    private readonly paypal: PaypalAdapter,
    private readonly mercadopago: MercadoPagoAdapter,
  ) {}

  async execute(dto: CreatePaymentIntentDto) {
    this.logger.log(`🚀 Procesando CreatePaymentSession para orderId: ${dto.orderId}`);

    let order: any = null;

    // 1. BÚSQUEDA SEGURA EN PRISMA (Evita el colapso 500 si orderId no es un UUID válido)
    try {
      order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { id: dto.orderId },
            { order_number: dto.orderId },
          ],
        },
      });
    } catch (dbError) {
      this.logger.warn(`⚠️ No se pudo buscar en la BD por formato de ID (${dto.orderId}), continuando en modo resiliencia.`);
    }

    // 2. FALLBACK PARA PRUEBAS Y DEMOSTRACIONES (Si no existe la orden aún en Postgres)
    const orderTotal = order ? Number(order.total) : (dto as any).amount || 100;
    const orderCurrency = order ? order.currency : 'PEN';
    const orderNumber = order ? order.order_number : dto.orderId;
    const orderIdToUse = order ? order.id : dto.orderId;

    const method = dto.paymentMethod || (dto as any).payment_method;

    try {
      // 🚀 STRIPE
      if (method === 'stripe') {
        const intent = await this.stripe.createPaymentIntent(
          orderTotal,
          orderCurrency,
          orderIdToUse,
        );
        return { clientSecret: intent.client_secret, gatewayId: intent.id };
      }

      // 🚀 PAYPAL
      if (method === 'paypal') {
        const paypalOrder = await this.paypal.createOrder(
          orderTotal,
          orderCurrency,
          orderNumber,
          orderIdToUse,
        );
        return { paypalOrderId: paypalOrder.id || orderIdToUse };
      }

      // 🚀 MERCADO PAGO
      if (method === 'mercado_pago') {
        const preference = await this.mercadopago.createPreference(
          orderTotal,
          orderIdToUse,
          orderNumber,
        );
        return { preferenceId: preference.id };
      }

      throw new BadRequestException(
        `El método de pago enviado '${method}' no es válido en el sistema.`,
      );

    } catch (gatewayError: any) {
      // 🛡️ CAPTURA DE ERRORES DE ADAPTADOR: Si el SDK de MP o PayPal falla, se imprime el error exacto
      this.logger.error(`❌ Error en adaptador pasarela (${method}):`, gatewayError?.message || gatewayError);

      if (gatewayError instanceof BadRequestException) {
        throw gatewayError;
      }

      throw new InternalServerErrorException(
        `Error al comunicarse con la pasarela de pago (${method}): ${gatewayError?.message || 'Verifica credenciales en .env'}`,
      );
    }
  }
}
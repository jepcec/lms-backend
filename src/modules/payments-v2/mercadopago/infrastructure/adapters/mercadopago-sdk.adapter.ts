import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

@Injectable()
export class MercadoPagoSdkAdapter {
  private readonly logger = new Logger(MercadoPagoSdkAdapter.name);
  private readonly client: MercadoPagoConfig;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.error('MERCADOPAGO_ACCESS_TOKEN no configurado (payments-v2)');
    }
    this.client = new MercadoPagoConfig({
      accessToken: accessToken ?? '',
      options: { timeout: 8000 },
    });
  }

  async createPreference(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
  }) {
    const preference = new Preference(this.client);
    try {
      return await preference.create({
        body: {
          items: [
            {
              id: params.orderId,
              title: `Escuela Global - Orden #${params.orderNumber}`,
              quantity: 1,
              currency_id: params.currency,
              unit_price: params.amount,
            },
          ],
          external_reference: params.orderId,
        },
      });
    } catch (err: any) {
      this.logger.error('Error creando preferencia MP (v2)', err?.message ?? err);
      throw new InternalServerErrorException(
        'No se pudo crear la preferencia de Mercado Pago',
      );
    }
  }

  async createPayment(body: Record<string, any>) {
    const payment = new Payment(this.client);
    const idempotencyKey = randomUUID();
    return payment.create({ body, requestOptions: { idempotencyKey } });
  }

  async getPayment(paymentId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }

  verifyWebhookSignature(params: {
    xSignature?: string;
    xRequestId?: string;
    dataId?: string;
  }): boolean {
    const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'MERCADOPAGO_WEBHOOK_SECRET no configurado — se omite la verificación de firma del webhook (solo apto para desarrollo)',
      );
      return true;
    }

    if (!params.xSignature) {
      return false;
    }

    let ts: string | undefined;
    let hash: string | undefined;
    for (const part of params.xSignature.split(',')) {
      const [key, value] = part.split('=').map((s) => s.trim());
      if (key === 'ts') ts = value;
      if (key === 'v1') hash = value;
    }

    if (!ts || !hash) {
      return false;
    }

    const manifestParts: string[] = [];
    if (params.dataId) manifestParts.push(`id:${params.dataId.toLowerCase()}`);
    if (params.xRequestId) manifestParts.push(`request-id:${params.xRequestId}`);
    manifestParts.push(`ts:${ts}`);
    const manifest = `${manifestParts.join(';')};`;

    const computed = createHmac('sha256', secret).update(manifest).digest('hex');

    const computedBuf = Buffer.from(computed, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    if (computedBuf.length !== hashBuf.length) {
      return false;
    }
    return timingSafeEqual(computedBuf, hashBuf);
  }
}

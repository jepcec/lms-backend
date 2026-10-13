import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaypalCapture {
  id: string;
  status: string; // COMPLETED | PENDING | DECLINED | ...
  amount: { currency_code: string; value: string };
  custom_id?: string;
}

interface PaypalOAuthResponse {
  access_token?: string;
  expires_in?: number;
}

interface PaypalOrderResponse {
  id?: string;
  details?: { issue?: string }[];
  purchase_units?: {
    payments?: { captures?: PaypalCapture[] };
  }[];
}

interface PaypalVerifyResponse {
  verification_status?: string;
}

export interface PaypalWebhookHeaders {
  authAlgo?: string;
  certUrl?: string;
  transmissionId?: string;
  transmissionSig?: string;
  transmissionTime?: string;
}

// No hay SDK oficial de PayPal instalado: se usa la API REST v2 con fetch.
@Injectable()
export class PaypalRestAdapter {
  private readonly logger = new Logger(PaypalRestAdapter.name);
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    return this.configService.get<string>('PAYPAL_MODE') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  // Credenciales leídas de forma perezosa (igual que CulqiSdkAdapter): si
  // faltan, solo falla PayPal y no el arranque de todo payments-v2.
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.value;
    }

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      this.logger.error(
        'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados (payments-v2)',
      );
      throw new InternalServerErrorException(
        'PayPal no está configurado en este servidor',
      );
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data = (await response
      .json()
      .catch(() => ({}))) as PaypalOAuthResponse;

    if (!response.ok || !data.access_token) {
      this.logger.error(
        `Error de autenticación con PayPal: ${JSON.stringify(data)}`,
      );
      throw new BadGatewayException('No se pudo autenticar con PayPal');
    }

    // Se renueva 60 s antes de que venza para no usar un token a punto de expirar.
    this.accessToken = {
      value: data.access_token,
      expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
    };
    return this.accessToken.value;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    requestId?: string,
  ): Promise<{ ok: boolean; status: number; data: T }> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Idempotencia: reintentar con el mismo id no duplica la operación.
        ...(requestId && { 'PayPal-Request-Id': requestId }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json().catch(() => ({}))) as T;
    return { ok: response.ok, status: response.status, data };
  }

  async createOrder(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
  }): Promise<{ id: string }> {
    const { ok, data } = await this.request<PaypalOrderResponse>(
      'POST',
      '/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.orderId,
            custom_id: params.orderId,
            invoice_id: params.orderNumber,
            description: `Escuela Global - Orden #${params.orderNumber}`,
            amount: {
              currency_code: params.currency,
              value: params.amount.toFixed(2),
            },
          },
        ],
      },
      `create-${params.orderId}`,
    );

    if (!ok || !data.id) {
      this.logger.error(
        `PayPal rechazó la creación de la orden: ${JSON.stringify(data)}`,
      );
      throw new BadGatewayException('No se pudo crear la orden en PayPal');
    }
    return { id: data.id };
  }

  /**
   * Captura una orden aprobada y devuelve la captura de su primer
   * purchase_unit. Si ya había sido capturada (p. ej. reintento del
   * navegador), consulta la orden y devuelve esa captura.
   */
  async captureOrder(paypalOrderId: string): Promise<PaypalCapture | null> {
    const { ok, data } = await this.request<PaypalOrderResponse>(
      'POST',
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      undefined,
      `capture-${paypalOrderId}`,
    );

    let order = data;
    if (!ok) {
      const alreadyCaptured = data.details?.some(
        (d) => d.issue === 'ORDER_ALREADY_CAPTURED',
      );
      if (!alreadyCaptured) {
        this.logger.warn(
          `PayPal rechazó la captura ${paypalOrderId}: ${JSON.stringify(data)}`,
        );
        return null;
      }
      order = await this.getOrder(paypalOrderId);
    }

    return this.extractCapture(order);
  }

  async getOrder(paypalOrderId: string): Promise<PaypalOrderResponse> {
    const { ok, data } = await this.request<PaypalOrderResponse>(
      'GET',
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    );
    if (!ok)
      throw new BadGatewayException('No se pudo consultar la orden en PayPal');
    return data;
  }

  async getCapture(captureId: string): Promise<PaypalCapture> {
    const { ok, data } = await this.request<PaypalCapture>(
      'GET',
      `/v2/payments/captures/${encodeURIComponent(captureId)}`,
    );
    if (!ok)
      throw new BadGatewayException(
        'No se pudo consultar la captura en PayPal',
      );
    return this.toCapture(data);
  }

  /**
   * Verifica la firma de un webhook con la API de PayPal
   * (/v1/notifications/verify-webhook-signature). Requiere PAYPAL_WEBHOOK_ID,
   * el id del webhook registrado en el dashboard de PayPal.
   */
  async verifyWebhookSignature(
    headers: PaypalWebhookHeaders,
    event: unknown,
  ): Promise<boolean> {
    const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
    if (!webhookId) {
      this.logger.error(
        'PAYPAL_WEBHOOK_ID no configurado: se rechazan los webhooks de PayPal',
      );
      return false;
    }
    if (
      !headers.authAlgo ||
      !headers.certUrl ||
      !headers.transmissionId ||
      !headers.transmissionSig ||
      !headers.transmissionTime
    ) {
      return false;
    }

    const { ok, data } = await this.request<PaypalVerifyResponse>(
      'POST',
      '/v1/notifications/verify-webhook-signature',
      {
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      },
    );
    return ok && data.verification_status === 'SUCCESS';
  }

  private extractCapture(order: PaypalOrderResponse): PaypalCapture | null {
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    return capture ? this.toCapture(capture) : null;
  }

  private toCapture(capture: PaypalCapture): PaypalCapture {
    return {
      id: capture.id,
      status: capture.status,
      amount: capture.amount,
      custom_id: capture.custom_id,
    };
  }
}

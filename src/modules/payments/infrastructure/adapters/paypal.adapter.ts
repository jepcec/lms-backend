import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class PaypalAdapter {
  private paypalUrl =
    process.env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.api.paypal.com';

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

  async createOrder(
    amount: number,
    currency: string,
    orderNumber: string,
    orderId: string,
  ) {
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
            reference_id: orderId,
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
            description: `Matrícula Escuela Global - Orden #${orderNumber}`,
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/checkout/success`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        },
      }),
    });

    if (!response.ok)
      throw new HttpException(
        'Error al procesar orden en PayPal',
        HttpStatus.BAD_REQUEST,
      );
    return response.json();
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

    const data = await response.json();
    if (!response.ok || data.status !== 'COMPLETED') {
      throw new HttpException(
        'El pago no fue aprobado en PayPal',
        HttpStatus.BAD_REQUEST,
      );
    }
    return data;
  }
}

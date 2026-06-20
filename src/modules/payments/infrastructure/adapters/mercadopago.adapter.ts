import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class MercadoPagoAdapter {
  private mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  // El método de cobro directo con tarjeta que ya tenías
  async processPayment(body: any) {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });
    return response.json();
  }

  // 🚀 NUEVO MÉTODO: Crea una preferencia oficial en Mercado Pago para habilitar Wallet y Efectivo
  async createPreference(amount: number, orderId: string, orderNumber: string) {
    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.mpToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: orderId,
              title: `Matrícula Escuela Global - Orden #${orderNumber}`,
              quantity: 1,
              currency_id: 'PEN', // Moneda local Perú
              unit_price: amount,
            },
          ],
          external_reference: orderId,
        }),
      },
    );

    if (!response.ok)
      throw new HttpException(
        'Error al crear preferencia en Mercado Pago',
        HttpStatus.BAD_REQUEST,
      );
    return response.json();
  }
}

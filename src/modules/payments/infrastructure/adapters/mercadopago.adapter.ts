import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);

  // 🚀 Helper dinámico: Lee el token en tiempo de ejecución para evitar que valga 'undefined'
  private get mpToken(): string {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      this.logger.error('❌ [MercadoPagoAdapter] MERCADOPAGO_ACCESS_TOKEN no está presente en el .env del backend!');
    }
    return token || '';
  }

  // El método de cobro directo con tarjeta (Brick)
  async processPayment(body: any) {
    const token = this.mpToken;
    if (!token) {
      throw new HttpException(
        'MERCADOPAGO_ACCESS_TOKEN no configurado en el servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error('❌ Error en processPayment de Mercado Pago:', data);
      throw new HttpException(
        data.message || 'Error al procesar el pago con Mercado Pago',
        response.status || HttpStatus.BAD_REQUEST,
      );
    }

    return data;
  }

  // 🚀 MÉTODO DE PREFERENCIA CORREGIDO
  async createPreference(amount: number, orderId: string, orderNumber: string) {
    const token = this.mpToken;

    if (!token) {
      throw new HttpException(
        'Falta la credencial MERCADOPAGO_ACCESS_TOKEN en el .env del backend',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 🛡️ Aseguramos que el precio sea un número válido y positivo
    const numericAmount = Number(amount);
    const validAmount = isNaN(numericAmount) || numericAmount <= 0 ? 100 : numericAmount;

    this.logger.log(`📡 Solicitando preferencia MP: Orden #${orderNumber} | Monto: S/ ${validAmount}`);

    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: orderId,
              title: `Matrícula Escuela Global - Orden #${orderNumber}`,
              quantity: 1,
              currency_id: 'PEN', // Moneda local Perú
              unit_price: validAmount,
            },
          ],
          external_reference: orderId,
        }),
      },
    );

    const data = await response.json();

    // 🛡️ CAPTURA DE DIAGNÓSTICO: Si Mercado Pago rechaza la preferencia, imprima la respuesta oficial
    if (!response.ok) {
      this.logger.error('❌ Respuesta de error devuelta por Mercado Pago API:', JSON.stringify(data, null, 2));
      throw new HttpException(
        data.message || 'Error al crear la preferencia en Mercado Pago',
        response.status || HttpStatus.BAD_REQUEST,
      );
    }

    return data;
  }
}
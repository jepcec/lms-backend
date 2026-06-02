import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class PaypalAdapter {
  private clientId = process.env.PAYPAL_CLIENT_ID;
  private clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // 1. Obtiene el Token Bearer seguro de PayPal
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('❌ [PAYPAL AUTH ERROR]: Credenciales incorrectas en el .env', errData);
      throw new HttpException('Error de autenticación con PayPal', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const data = await response.json();
    return data.access_token;
  }

  // 2. Crea la orden oficial en los servidores de Sandbox
  async createOrder(amount: number, currency: string, orderNumber: string, orderId: string) {
    try {
      const accessToken = await this.getAccessToken();
      const finalAmount = currency === 'PEN' ? (amount / 3.75) : amount;

      const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
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
              description: `Matrícula Escuela Global - Orden #${orderNumber}`,
              amount: {
                currency_code: 'USD',
                value: finalAmount.toFixed(2),
              },
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [PAYPAL API ERROR]: PayPal rechazó el cuerpo del JSON:', JSON.stringify(data, null, 2));
        throw new HttpException('Error al crear orden en servidores de PayPal', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data; 
    } catch (error) {
      console.error('❌ [PAYPAL ADAPTER CRASH]:', error);
      throw new HttpException('Fallo crítico en el adaptador de PayPal', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 🚀 NUEVO MÉTODO CORREGIDO: Ejecuta la captura definitiva del dinero del alumno en los servidores de PayPal
  async capturePayment(paypalOrderId: string) {
    try {
      const accessToken = await this.getAccessToken();

      // Pega directo al endpoint oficial de captura de PayPal v2 pasando el ID dinámico
      const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [PAYPAL CAPTURE ERROR]:', JSON.stringify(data, null, 2));
        throw new HttpException('Error al capturar el pago en los servidores de PayPal', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return data;
    } catch (error) {
      console.error('❌ [PAYPAL CAPTURE CRASH]:', error);
      throw new HttpException('Fallo crítico al procesar la captura de PayPal', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
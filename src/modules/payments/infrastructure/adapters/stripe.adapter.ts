import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class StripeAdapter {
  private stripeSecret = process.env.STRIPE_SECRET_KEY;

  async createPaymentIntent(amount: number, currency: string, orderId: string) {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Stripe maneja centavos
        currency: currency.toLowerCase(),
        'metadata[orderId]': orderId,
      }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new HttpException(
        'Error con la API de Stripe',
        HttpStatus.BAD_REQUEST,
      );
    return data;
  }
}

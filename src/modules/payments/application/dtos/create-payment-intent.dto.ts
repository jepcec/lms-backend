import { PaymentMethod } from '../../../../generated/prisma/enums';

export class CreatePaymentIntentDto {
  orderId!: string; // Añadido el operador !

  paymentMethod!: PaymentMethod | 'paypal' | 'mercado_pago'; // Añadido el operador !
}
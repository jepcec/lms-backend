import { OrderCurrency } from '../../../../generated/prisma/enums';
import type { PaypalCapture } from '../infrastructure/adapters/paypal-rest.adapter';

// PayPal no liquida en soles: las órdenes pagadas con PayPal se crean en USD
// con el precio en dólares del curso (ver CreateOrderUseCase).
export const PAYPAL_SUPPORTED_CURRENCY: OrderCurrency = OrderCurrency.USD;

/**
 * Una captura solo confirma la orden si está completada, pertenece a esa orden
 * (custom_id) y cobró exactamente el total en la moneda de la orden.
 */
export function captureMatchesOrder(
  capture: PaypalCapture,
  order: { id: string; total: unknown; currency: string },
): boolean {
  return (
    capture.status === 'COMPLETED' &&
    capture.custom_id === order.id &&
    capture.amount?.currency_code === order.currency &&
    capture.amount?.value === Number(order.total).toFixed(2)
  );
}

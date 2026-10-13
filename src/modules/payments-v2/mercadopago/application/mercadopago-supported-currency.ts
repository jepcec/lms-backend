import { OrderCurrency } from '../../../../generated/prisma/enums';

// La cuenta de Mercado Pago configurada (MERCADOPAGO_ACCESS_TOKEN) está registrada
// en Perú y solo puede liquidar pagos en esa moneda — cada cuenta de MP está atada
// a un único país/moneda, no existe un modo multi-moneda por cuenta.
export const MERCADOPAGO_SUPPORTED_CURRENCY: OrderCurrency = OrderCurrency.PEN;

import { OrderCurrency } from '../../../../generated/prisma/enums';

// Culqi está confirmado para soles (PEN). No hay certeza documental de que
// esta cuenta también pueda liquidar en USD, así que por ahora se restringe
// a PEN — igual de conservador que Mercado Pago — y se amplía una vez
// confirmado con una prueba real en el sandbox.
export const CULQI_SUPPORTED_CURRENCY: OrderCurrency = OrderCurrency.PEN;

// Mapeo de los `status_detail` que devuelve Mercado Pago ante un pago rechazado
// a mensajes en español entendibles para el estudiante. Códigos documentados
// oficialmente por MP en "Cómo interpretar los resultados de los pagos".
const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'Revisa el número de tu tarjeta.',
  cc_rejected_bad_filled_date: 'Revisa la fecha de vencimiento de tu tarjeta.',
  cc_rejected_bad_filled_other: 'Revisa los datos de tu tarjeta.',
  cc_rejected_bad_filled_security_code: 'Revisa el código de seguridad de tu tarjeta.',
  cc_rejected_blacklist: 'No pudimos procesar tu pago con esta tarjeta.',
  cc_rejected_call_for_authorize: 'Debes autorizar el pago con tu banco antes de volver a intentarlo.',
  cc_rejected_card_disabled: 'Tu tarjeta está deshabilitada. Llama a tu banco para activarla o usa otra tarjeta.',
  cc_rejected_card_error: 'No pudimos procesar el pago con esta tarjeta.',
  cc_rejected_duplicated_payment: 'Ya hiciste un pago por ese valor. Si necesitas volver a pagar, usa otro medio.',
  cc_rejected_high_risk: 'Tu pago fue rechazado por seguridad. Intenta con otra tarjeta o medio de pago.',
  cc_rejected_insufficient_amount: 'Tu tarjeta no tiene fondos suficientes.',
  cc_rejected_invalid_installments: 'Tu tarjeta no procesa pagos con el número de cuotas elegido.',
  cc_rejected_max_attempts: 'Llegaste al límite de intentos permitidos. Usa otra tarjeta.',
  cc_rejected_other_reason: 'Tu banco no autorizó el pago. Intenta con otra tarjeta o medio de pago.',
};

const DEFAULT_MESSAGE = 'Tu banco no autorizó el pago. Intenta con otra tarjeta o medio de pago.';

export function translateMercadoPagoRejection(statusDetail?: string): string {
  if (!statusDetail) return DEFAULT_MESSAGE;
  return REJECTION_MESSAGES[statusDetail] ?? DEFAULT_MESSAGE;
}

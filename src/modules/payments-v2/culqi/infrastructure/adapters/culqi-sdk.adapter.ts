import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// culqi-node no publica tipos para su export default (CommonJS `export =`);
// se importa con require para evitar fricciones de interop ESM/CJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Culqi = require('culqi-node');

export interface CulqiChargeResult {
  id: string;
  paid: boolean;
  outcomeType: string;
  userMessage: string;
  orderId: string | undefined;
}

@Injectable()
export class CulqiSdkAdapter {
  private readonly logger = new Logger(CulqiSdkAdapter.name);
  private client: any;

  constructor(private readonly configService: ConfigService) {}

  // Inicialización perezosa: el SDK de Culqi lanza una excepción síncrona en
  // su constructor si falta `privateKey`. Si esto se hiciera en el
  // constructor del adapter, faltar la credencial rompería el arranque de
  // TODO el módulo de pagos (Mercado Pago incluido), no solo Culqi.
  private getClient(): any {
    if (this.client) return this.client;

    const privateKey = this.configService.get<string>('CULQI_SECRET_KEY');
    if (!privateKey) {
      this.logger.error('CULQI_SECRET_KEY no configurado (payments-v2)');
      throw new InternalServerErrorException(
        'Culqi no está configurado en este servidor',
      );
    }
    this.client = new Culqi({ privateKey });
    return this.client;
  }

  async createCharge(params: {
    amount: number;
    currency: string;
    email: string;
    sourceId: string;
    description: string;
    orderId: string;
  }): Promise<CulqiChargeResult> {
    try {
      const charge = await this.getClient().charges.createCharge({
        amount: String(params.amount),
        currency_code: params.currency,
        email: params.email,
        source_id: params.sourceId,
        description: params.description,
        metadata: { orderId: params.orderId },
      });
      return {
        id: charge.id,
        paid: charge.paid,
        outcomeType: charge.outcome?.type,
        userMessage: charge.outcome?.user_message,
        orderId: charge.metadata?.orderId,
      };
    } catch (err: any) {
      this.logger.error('Error creando cargo Culqi', err?.message ?? err);
      const userMessage = err?.response?.data?.user_message;
      throw new InternalServerErrorException(
        userMessage || 'No se pudo procesar el pago con Culqi',
      );
    }
  }

  async getCharge(id: string): Promise<CulqiChargeResult> {
    const charge = await this.getClient().charges.getCharge({ id });
    return {
      id: charge.id,
      paid: charge.paid,
      outcomeType: charge.outcome?.type,
      userMessage: charge.outcome?.user_message,
      orderId: charge.metadata?.orderId,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileSiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
  hostname?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      this.logger.error(
        '❌ [TurnstileService] TURNSTILE_SECRET_KEY no está presente en el .env del backend!',
      );
      return false;
    }

    try {
      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret,
            response: token,
            ...(remoteIp ? { remoteip: remoteIp } : {}),
          }),
        },
      );

      const data = (await response.json()) as TurnstileSiteverifyResponse;

      if (!data.success) {
        this.logger.warn(
          `⚠️ Turnstile rechazó el token: ${JSON.stringify(data['error-codes'])}`,
        );
      }

      return data.success === true;
    } catch (error) {
      this.logger.error('❌ Error al verificar token de Turnstile:', error);
      return false;
    }
  }
}

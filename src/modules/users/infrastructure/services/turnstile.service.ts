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

      if (data.success !== true) return false;

      const configuredHostnames = this.configService
        .get<string>('TURNSTILE_ALLOWED_HOSTNAMES')
        ?.split(',')
        .map((hostname) => this.normalizeHostname(hostname))
        .filter(Boolean);
      let allowedHostnames = new Set(configuredHostnames ?? []);

      // Compatibilidad: si no se definió una allowlist, usa el hostname canónico.
      if (allowedHostnames.size === 0) {
        const frontendUrl = this.configService.get<string>('URL_FRONTEND');
        try {
          allowedHostnames = new Set([
            this.normalizeHostname(new URL(frontendUrl ?? '').hostname),
          ]);
        } catch {
          this.logger.error('URL_FRONTEND no es una URL válida');
          return false;
        }
      }

      const verifiedHostname = this.normalizeHostname(data.hostname ?? '');
      if (!verifiedHostname || !allowedHostnames.has(verifiedHostname)) {
        this.logger.warn(
          `Hostname de Turnstile no autorizado: recibido="${verifiedHostname || '(vacío)'}", permitidos=${[...allowedHostnames].join(',')}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('❌ Error al verificar token de Turnstile:', error);
      return false;
    }
  }

  private normalizeHostname(hostname: string): string {
    return hostname.trim().toLowerCase().replace(/\.$/, '');
  }
}

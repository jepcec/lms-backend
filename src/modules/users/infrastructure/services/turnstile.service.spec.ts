import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  const configValues: Record<string, string> = {
    TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_ALLOWED_HOSTNAMES:
      'escuelaglobal.net,www.escuelaglobal.net,localhost',
    URL_FRONTEND: 'http://localhost:3000',
  };
  const config = {
    get: (key: string) => configValues[key],
  } as ConfigService;
  let service: TurnstileService;
  let siteverify: jest.SpyInstance;

  beforeEach(() => {
    service = new TurnstileService(config);
    siteverify = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, hostname: 'localhost' }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(['escuelaglobal.net', 'www.escuelaglobal.net', 'localhost'])(
    'acepta el hostname autorizado %s',
    async (hostname) => {
      siteverify.mockResolvedValue({
        json: async () => ({ success: true, hostname }),
      } as Response);

      await expect(service.verify('test-token')).resolves.toBe(true);
    },
  );

  it('rechaza hostnames que no están en la allowlist', async () => {
    siteverify.mockResolvedValue({
      json: async () => ({ success: true, hostname: 'malicioso.example' }),
    } as Response);

    await expect(service.verify('test-token')).resolves.toBe(false);
  });

  it('rechaza tokens que Cloudflare marca como inválidos', async () => {
    siteverify.mockResolvedValue({
      json: async () => ({
        success: false,
        hostname: 'escuelaglobal.net',
        'error-codes': ['invalid-input-response'],
      }),
    } as Response);

    await expect(service.verify('test-token')).resolves.toBe(false);
  });
});

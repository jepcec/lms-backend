import { createHash, randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Logger } from 'nestjs-pino';

const PUBLIC_GET_PATHS = new Set([
  '/api/sliders',
  '/api/docentes',
  '/api/courses/catalog',
  '/api/categories',
  '/api/promociones',
  '/api/lanzamientos',
  '/api/softwares',
  '/api/alianzas',
]);

// Identificadores comparables entre solicitudes de este proceso, sin registrar IPs.
const salt = randomBytes(32);

function fingerprint(address: string | undefined): string | null {
  if (!address) return null;
  return createHash('sha256')
    .update(salt)
    .update(address.trim())
    .digest('hex')
    .slice(0, 16);
}

export function installRateLimitIpDiagnostics(
  app: NestExpressApplication,
  logger: Logger,
): void {
  if (process.env.RATE_LIMIT_IP_DIAGNOSTICS !== 'true') return;

  const path = process.env.RATE_LIMIT_IP_DIAGNOSTIC_PATH ?? '/api/sliders';
  if (!PUBLIC_GET_PATHS.has(path)) {
    throw new Error(`RATE_LIMIT_IP_DIAGNOSTIC_PATH no permitida: ${path}`);
  }

  logger.warn(`Diagnóstico de IP activo para GET ${path}`, 'RateLimitIpDiagnostic');
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path !== path) return next();

    const forwarded = req.headers['x-forwarded-for'];
    const forwardedAddresses = (Array.isArray(forwarded)
      ? forwarded.join(',')
      : (forwarded ?? '')
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 8);

    const diagnostic = {
      event: 'rate_limit_ip_diagnostic',
      path,
      socketIp: fingerprint(req.socket.remoteAddress),
      forwardedFor: forwardedAddresses.map(fingerprint),
      expressIp: fingerprint(req.ip),
      expressIps: req.ips.map(fingerprint),
    };

    res.once('finish', () => {
      logger.log(
        {
          ...diagnostic,
          statusCode: res.statusCode,
          remaining: res.getHeader('x-ratelimit-remaining') ?? null,
        },
        'RateLimitIpDiagnostic',
      );
    });
    next();
  });
}

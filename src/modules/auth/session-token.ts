import { ConfigService } from '@nestjs/config';

export type SessionTokenType = 'access' | 'refresh';

export interface SessionPrincipal {
  userId: string;
  role: string;
  sessionVersion: number;
}

export interface SessionTokenPayload {
  userId: string;
  sessionVersion: number;
  tokenType: SessionTokenType;
}

export function requireSessionSecrets(config: ConfigService) {
  const access = config.get<string>('JWT_SECRET');
  const refresh = config.get<string>('JWT_REFRESH_SECRET');
  if (!access || !refresh || access === refresh) {
    throw new Error('JWT_SECRET y JWT_REFRESH_SECRET deben existir y ser distintos');
  }
  return { access, refresh };
}

export function isSessionTokenPayload(
  value: unknown,
  tokenType: SessionTokenType,
): value is SessionTokenPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.tokenType === tokenType &&
    typeof payload.userId === 'string' &&
    payload.userId.length > 0 &&
    typeof payload.sessionVersion === 'number' &&
    Number.isSafeInteger(payload.sessionVersion) &&
    payload.sessionVersion >= 0
  );
}

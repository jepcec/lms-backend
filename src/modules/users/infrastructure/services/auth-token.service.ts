// src/modules/users/infrastructure/services/jwt-token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthTokenService } from '../../domain/services/auth.service';
import { ConfigService } from '@nestjs/config';
import {
  isSessionTokenPayload,
  requireSessionSecrets,
  type SessionPrincipal,
} from '../../../auth/session-token';

@Injectable()
export class TokenService implements IAuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generate(payload: SessionPrincipal): string {
    const { access } = requireSessionSecrets(this.configService);
    return this.jwtService.sign(
      {
        userId: payload.userId,
        role: payload.role,
        sessionVersion: payload.sessionVersion,
        tokenType: 'access',
      },
      { secret: access, expiresIn: '5m' },
    );
  }

  generateRefresh(payload: SessionPrincipal): string {
    const { refresh } = requireSessionSecrets(this.configService);
    return this.jwtService.sign(
      {
        userId: payload.userId,
        sessionVersion: payload.sessionVersion,
        tokenType: 'refresh',
      },
      { secret: refresh, expiresIn: '7d' },
    );
  }
  verifyRefresh(token: string) {
    const { refresh } = requireSessionSecrets(this.configService);
    try {
      const payload = this.jwtService.verify<Record<string, unknown>>(token, {
        secret: refresh,
      });
      return isSessionTokenPayload(payload, 'refresh') ? payload : null;
    } catch (error) {
      return null;
    }
  }
  generateActionToken(payload: {
    userId: string;
    action: 'verify' | 'recover';
  }): string {
    const secret = this.configService.get<string>('JWT_ACTION_SECRET');
    return this.jwtService.sign(payload, { secret, expiresIn: '15m' });
  }
  verifyActionToken(token: string) {}
}

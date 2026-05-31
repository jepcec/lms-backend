// src/modules/users/infrastructure/services/jwt-token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthTokenService } from '../../domain/services/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService implements IAuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generate(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  generateRefresh(payload: { userId: string; role: string }): string {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    return this.jwtService.sign(
      { userId: payload.userId, role: payload.role },
      { secret: refreshSecret, expiresIn: '7d' },
    );
  }
  verifyRefresh(token: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    try {
      return this.jwtService.verify(token, { secret: refreshSecret });
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

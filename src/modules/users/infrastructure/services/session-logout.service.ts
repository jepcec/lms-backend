import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  isSessionTokenPayload,
  requireSessionSecrets,
  type SessionTokenType,
} from '../../../auth/session-token';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/users.repository';

@Injectable()
export class SessionLogoutService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async revokeFromCookies(cookies?: Record<string, unknown>): Promise<void> {
    const secrets = requireSessionSecrets(this.configService);
    const candidates: {
      token: unknown;
      type: SessionTokenType;
      secret: string;
    }[] = [
      { token: cookies?.refresh_token, type: 'refresh', secret: secrets.refresh },
      { token: cookies?.access_token, type: 'access', secret: secrets.access },
    ];

    for (const { token, type, secret } of candidates) {
      if (typeof token !== 'string') continue;
      let payload: Record<string, unknown>;
      try {
        payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
          token,
          { secret },
        );
      } catch {
        continue;
      }
      if (!isSessionTokenPayload(payload, type)) continue;
      await this.userRepository.revokeSessions(
        payload.userId,
        payload.sessionVersion,
      );
      return;
    }
  }
}

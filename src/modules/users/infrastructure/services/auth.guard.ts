import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from '../../../auth/decorators/public.decorator';
import {
  isSessionTokenPayload,
  requireSessionSecrets,
  type SessionTokenPayload,
  type SessionTokenType,
} from '../../../auth/session-token';
import { PrismaService } from '../../../../core/database/prisma.service';

interface ActiveUser {
  id: string;
  role: string;
  status: string;
  deleted_at: Date | null;
  session_version: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly secrets: ReturnType<typeof requireSessionSecrets>;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    this.secrets = requireSessionSecrets(configService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.['access_token'];

    if (isPublic) {
      // Rutas públicas pueden usar una sesión válida, pero nunca una revocada.
      const payload = await this.verify(accessToken, 'access', this.secrets.access);
      if (payload) {
        const user = await this.getActiveUser(payload);
        if (user) request['user'] = { userId: user.id, role: user.role };
      }
      return true;
    }

    const response = context.switchToHttp().getResponse<Response>();
    const accessPayload = await this.verify(
      accessToken,
      'access',
      this.secrets.access,
    );
    if (accessPayload) {
      const user = await this.getActiveUser(accessPayload);
      if (!user) {
        this.clearAuthCookies(response);
        throw new UnauthorizedException('Sesion expirada o invalida');
      }
      request['user'] = { userId: user.id, role: user.role };
      return true;
    }

    const refreshToken = request.cookies?.['refresh_token'];
    const refreshPayload = await this.verify(
      refreshToken,
      'refresh',
      this.secrets.refresh,
    );
    if (!refreshPayload) {
      if (refreshToken) this.clearAuthCookies(response);
      throw new UnauthorizedException('Sesion expirada o invalida');
    }

    const user = await this.getActiveUser(refreshPayload);
    if (!user) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Sesion expirada o invalida');
    }

    const newAccessToken = this.jwtService.sign(
      {
        userId: user.id,
        role: user.role,
        sessionVersion: user.session_version,
        tokenType: 'access',
      },
      { secret: this.secrets.access, expiresIn: '5m' },
    );
    response.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });
    request['user'] = { userId: user.id, role: user.role };
    return true;
  }

  private async verify(
    token: unknown,
    type: SessionTokenType,
    secret: string,
  ): Promise<SessionTokenPayload | null> {
    if (typeof token !== 'string') return null;
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
        token,
        { secret },
      );
      return isSessionTokenPayload(payload, type) ? payload : null;
    } catch {
      return null;
    }
  }

  private async getActiveUser(
    payload: SessionTokenPayload,
  ): Promise<ActiveUser | null> {
    const user = (await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        status: true,
        deleted_at: true,
        session_version: true,
      },
    } as any)) as ActiveUser | null;
    if (
      !user ||
      user.status !== 'active' ||
      user.deleted_at ||
      user.session_version !== payload.sessionVersion
    ) {
      return null;
    }
    return user;
  }

  private clearAuthCookies(response: Response): void {
    const options = {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax' as const,
      path: '/',
    };
    response.clearCookie('access_token', options);
    response.clearCookie('refresh_token', options);
  }
}

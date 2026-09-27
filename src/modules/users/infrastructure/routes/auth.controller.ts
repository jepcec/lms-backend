import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Get,
  BadRequestException,
  ForbiddenException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import type { Request, Response } from 'express';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import type { IUserRepository } from '../../domain/users.repository';
import { Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TurnstileGuard } from '../guards/turnstile.guard';
import { SessionLogoutService } from '../services/session-logout.service';

// Límite más estricto que el global (100/60s) para las rutas de auth más
// sensibles a fuerza bruta / spam — defensa en profundidad junto a Turnstile.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUserCase: LoginUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly passwordResetUseCase: ResetPasswordUseCase,
    private readonly sessionLogoutService: SessionLogoutService,
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  private assertTrustedBrowserOrigin(request: Request): void {
    const origin = request.headers.origin;
    const frontend = process.env.URL_FRONTEND;
    if (origin) {
      let expectedOrigin: string;
      try {
        expectedOrigin = new URL(frontend ?? '').origin;
      } catch {
        throw new ForbiddenException('Origen no permitido');
      }
      if (origin !== expectedOrigin) {
        throw new ForbiddenException('Origen no permitido');
      }
    } else if (request.headers['sec-fetch-site'] === 'cross-site') {
      throw new ForbiddenException('Origen no permitido');
    }
  }

  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refresh_token: string },
  ) {
    const secure = process.env.COOKIE_SECURE === 'true';
    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });
    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  // registro de usuario (no auto-loguea: el usuario debe verificar su correo primero)
  @Post('register')
  @Public()
  @UseGuards(TurnstileGuard)
  @Throttle(AUTH_THROTTLE)
  async register(@Body() dto: RegisterUserDto) {
    if (
      !dto ||
      typeof dto.first_name !== 'string' ||
      typeof dto.last_name !== 'string' ||
      typeof dto.email !== 'string' ||
      typeof dto.phone !== 'string' ||
      typeof dto.password !== 'string'
    ) {
      throw new BadRequestException('Datos de registro inválidos');
    }
    const result = await this.registerUseCase.execute(dto);
    return {
      success: result.success,
      message: result.message,
      user: result.user,
    };
  }

  // verifica si un correo ya está registrado (usado en el checkout de invitado)
  @Public()
  @Get('check-email')
  @Throttle(AUTH_THROTTLE)
  async checkEmail(@Query('email') email: string) {
    if (typeof email !== 'string' || !email) {
      throw new BadRequestException('Email requerido');
    }
    const existente = await this.userRepository.findByEmail(email);
    return { available: !existente };
  }

  // logeo de usuario + tokens
  @Post('login')
  @UseGuards(TurnstileGuard)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Req() request: Request,
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertTrustedBrowserOrigin(request);
    if (
      !dto ||
      typeof dto.email !== 'string' ||
      typeof dto.password !== 'string'
    ) {
      throw new BadRequestException('Credenciales inválidas');
    }
    const result = await this.loginUserCase.execute(dto);
    this.setAuthCookies(response, result);
    return {
      mensaje: 'login exitoso',
      user: result.user,
    };
  }

  // verificar un email cuando usuario se registra
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (typeof token !== 'string' || !token) {
      throw new BadRequestException('Token requerido');
    }
    await this.verifyEmailUseCase.execute(token);
    return { mensaje: 'Correo verificado' };
  }

  // recuperacion de password, cuando presiona me olvide
  // Evitar el spam con Throtleguard
  @Post('forgot-password')
  @UseGuards(TurnstileGuard)
  @Throttle(AUTH_THROTTLE)
  async forgotPassword(
    @Body('email') email: string,
    @Body('turnstileToken') turnstileToken: string,
  ) {
    if (typeof email !== 'string' || !email) {
      throw new BadRequestException('Email requerido');
    }
    await this.requestPasswordReset.execute(email);
    return { mensaje: 'Se envio correo para recuperacion' };
  }

  // resetear password
  // refactorizar parametros
  @Post('reset-password')
  @UseGuards(TurnstileGuard)
  @Throttle(AUTH_THROTTLE)
  async resetPassword(
    @Body()
    body: { password: string; token: string; turnstileToken: string },
  ) {
    if (!body || typeof body.token !== 'string' || !body.token) {
      throw new BadRequestException('Token invalido');
    }
    await this.passwordResetUseCase.execute(body.password, body.token);
    return { mensaje: 'Contrase;a actualizada correctamente' };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertTrustedBrowserOrigin(request);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax' as const,
      path: '/',
    };
    try {
      await this.sessionLogoutService.revokeFromCookies(request.cookies);
    } finally {
      response.clearCookie('access_token', cookieOptions);
      response.clearCookie('refresh_token', cookieOptions);
    }
    return { mensaje: 'Sesión cerrada' };
  }
}

// falta por hacer
// - implementacin de refresh refresh

import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Get,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import type { Response } from 'express';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import type { IUserRepository } from '../../domain/users.repository';
import { Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TurnstileGuard } from '../guards/turnstile.guard';

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
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

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
  async checkEmail(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email requerido');
    const existente = await this.userRepository.findByEmail(email);
    return { available: !existente };
  }

  // logeo de usuario + tokens
  @Post('login')
  @UseGuards(TurnstileGuard)
  @Throttle(AUTH_THROTTLE)
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
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
    if (!token) throw new BadRequestException('Token requerido');
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
    await this.passwordResetUseCase.execute(body.password, body.token);
    return { mensaje: 'Contrase;a actualizada correctamente' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax' as const,
      path: '/',
    };
    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);
    return { mensaje: 'Sesión cerrada' };
  }
}

// falta por hacer
// - implementacin de refresh refresh

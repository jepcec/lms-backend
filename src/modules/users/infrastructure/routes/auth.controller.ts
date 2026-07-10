import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Get,
  BadRequestException,
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
      maxAge: 15 * 60 * 1000,
    });
    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  // registro de usuario (auto-loguea al crear la cuenta)
  @Post('register')
  @Public()
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.registerUseCase.execute(dto);
    this.setAuthCookies(response, result);
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
  async forgotPassword(@Body('email') email: string) {
    await this.requestPasswordReset.execute(email);
    return { mensaje: 'Se envio correo para recuperacion' };
  }

  // resetear password
  // refactorizar parametros
  @Post('reset-password')
  async resetPassword(@Body() body: { password: string; token: string }) {
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

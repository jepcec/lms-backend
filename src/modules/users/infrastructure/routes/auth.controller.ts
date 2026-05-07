import { Body, Controller, Post, Query, Res, Get, BadRequestException } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";
import { LoginUserUseCase } from "../../application/use-cases/login-user.use-case";
import { LoginUserDto } from "../../application/dtos/login-user.dto";
import type { Response } from "express";
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.use-case";
import { RequestPasswordResetUseCase } from "../../application/use-cases/request-password-reset.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case";

@Controller('auth')
export class AuthController{
	constructor(
		private readonly registerUseCase: RegisterUserUseCase,
		private readonly loginUserCase: LoginUserUseCase,
		private readonly verifyEmailUseCase: VerifyEmailUseCase,
		private readonly requestPasswordReset: RequestPasswordResetUseCase,
		private readonly passwordResetUseCase: ResetPasswordUseCase
	){}

	@Post('register')
	register(@Body() dto: RegisterUserDto){
		return this.registerUseCase.execute(dto)
	}

	@Post('login')
	async login(@Body() dto: LoginUserDto, @Res({passthrough: true}) response: Response){
		const result = await this.loginUserCase.execute(dto)   

		// cokies generadas se envian atravez de headers para el frontend
		response.cookie('access_token', result.accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 15 * 60 * 1000,
		});

		response.cookie('refresh_token', result.refresh_token,{
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
		})
		return {
			mensaje: 'login exitoso',
			user: result.user
		} 
	}

	@Get('verify-email')
	async verifyEmail(@Query('token') token: string){
		if(!token) throw new BadRequestException("Token requerido")

		await this.verifyEmailUseCase.execute(token)
		return {mensaje: 'Correo verificado'}
	}

	@Get('forgot-password')
	async forgotPassword(@Body('email') email: string){
		await this.requestPasswordReset.execute(email)
		return {mensaje: 'Se envio correo para recuperacion'}
	}

	@Post('reset-password')
	async resetPassword(newPassword: string, token: string){
		await this.passwordResetUseCase.execute(newPassword, token)
		return {mensaje: 'Contrase;a actualizada correctamente'}
	}

}


// falta por hacer
// - implementacin de refresh refresh

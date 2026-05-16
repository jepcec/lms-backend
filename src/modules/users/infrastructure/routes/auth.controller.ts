import { Body, Controller, Post, Query, Res, Get, BadRequestException } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";
import { LoginUserUseCase } from "../../application/use-cases/login-user.use-case";
import { LoginUserDto } from "../../application/dtos/login-user.dto";
import type { Response } from "express";
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.use-case";
import { RequestPasswordResetUseCase } from "../../application/use-cases/request-password-reset.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('auth')
@Public()
export class AuthController{
	constructor(
		private readonly registerUseCase: RegisterUserUseCase,
		private readonly loginUserCase: LoginUserUseCase,
		private readonly verifyEmailUseCase: VerifyEmailUseCase,
		private readonly requestPasswordReset: RequestPasswordResetUseCase,
		private readonly passwordResetUseCase: ResetPasswordUseCase
	){}
	// registro de usuario
	@Post('register')
	register(@Body() dto: RegisterUserDto){
		return this.registerUseCase.execute(dto)
	}

	// logeo de usuario + tokens
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
		
		// implementacion en un caso de uso
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

	// verificar un email cuando usuario se registra
	@Public()
	@Get('verify-email')
	async verifyEmail(@Query('token') token: string){
		if(!token) throw new BadRequestException("Token requerido")
		await this.verifyEmailUseCase.execute(token)
		return {mensaje: 'Correo verificado'}
	}

	// recuperacion de password, cuando presiona me olvide
	// Evitar el spam con Throtleguard
	@Post('forgot-password')
	async forgotPassword(@Body('email') email: string){
		await this.requestPasswordReset.execute(email)
		return {mensaje: 'Se envio correo para recuperacion'}
	}

	// resetear password 
	// refactorizar parametros
	@Post('reset-password')
	async resetPassword(@Body() body :{password: string, token: string} ){
		await this.passwordResetUseCase.execute(body.password,body.token)
		return {mensaje: 'Contrase;a actualizada correctamente'}
	}

}


// falta por hacer
// - implementacin de refresh refresh

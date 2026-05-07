import { Body, Controller, Post, Res } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";
import { LoginUserUseCase } from "../../application/use-cases/login-user.use-case";
import { LoginUserDto } from "../../application/dtos/login-user.dto";
import type { Response } from "express";

@Controller('auth')
export class AuthController{
	constructor(
		private readonly registerUseCase: RegisterUserUseCase,
		private readonly loginUserCase: LoginUserUseCase
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
}


// falta por hacer
// - implementacin de refresh refresh

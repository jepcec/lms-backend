import { Controller, Post } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";
import { LoginUserUseCase } from "../../application/use-cases/login-user.use-case";
import { LoginUserDto } from "../../application/dtos/login-user.dto";

@Controller('auth')
export class AuthController{
	constructor(
		private readonly registerUseCase: RegisterUserUseCase,
		private readonly loginUserCase: LoginUserUseCase
	){}

	@Post('register')
	register(dto: RegisterUserDto){
		return this.registerUseCase.execute(dto)
	}

	@Post('login')
	login(dto: LoginUserDto){
		return this.loginUserCase.execute(dto)
	}
}

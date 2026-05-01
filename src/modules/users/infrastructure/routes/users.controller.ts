import { Controller, Post, Body } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";

@Controller('users')
export class UsersController{
	constructor(private readonly userRegister: RegisterUserUseCase){}
	
	@Post('register')
	async register(dto: RegisterUserDto){
		return this.userRegister.execute(dto)
	}
}

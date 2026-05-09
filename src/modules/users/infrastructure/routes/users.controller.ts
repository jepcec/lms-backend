// src/modules/users/infrastructure/controllers/users.controller.ts
import { Controller, Post, Body, Patch, Param } from "@nestjs/common";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { RegisterUserDto } from "../../application/dtos/register-user.dto";
// Import de Update Profile
import { UpdateProfileUseCase } from "../../application/use-cases/update-profile.use-case";
import { UpdateProfileDto } from "../../application/dtos/update-profile.dto";

@Controller('users')
export class UsersController{
	constructor(private readonly userRegister: RegisterUserUseCase,
		private readonly updateProfile: UpdateProfileUseCase
	){}
	
	@Post('register')
	async register(dto: RegisterUserDto){
		return this.userRegister.execute(dto)
	}
	@Patch('profile/:id') // Endpoint para RF-004
    async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
        return this.updateProfile.execute(id, dto);
		
    }
}

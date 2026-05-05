import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { I_USER_REPOSITORY } from "../../domain/users.repository";
import type { IUserRepository } from "../../domain/users.repository";
import { I_PASSWORD_SERVICE, type IPasswordService } from "../../domain/services/auth.service";
import { I_AUTH_TOKEN_SERVICE, type IAuthTokenService } from "../../domain/services/auth.service";
import { LoginUserDto } from "../dtos/login-user.dto";

@Injectable()
export class LoginUserUseCase{
	constructor(
		@Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
		@Inject(I_PASSWORD_SERVICE) private readonly passwordService: IPasswordService,
		@Inject(I_AUTH_TOKEN_SERVICE) private readonly tokenService: IAuthTokenService
	){}
	async execute(dto: LoginUserDto){
		const user = await this.userRepository.findByEmail(dto.email)
		if(!user) throw new UnauthorizedException('Credenciales invalidas')

		const isPasswordValid = await this.passwordService.compare(dto.password,user.passwordHash )
		if(!isPasswordValid) throw new UnauthorizedException("Credenciales invalidas")

		const token = this.tokenService.generate({userId: user.id, role: user.role})
		return {accessToken: token}
	}
}

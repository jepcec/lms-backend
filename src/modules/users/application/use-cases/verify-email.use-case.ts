import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { I_USER_REPOSITORY,type IUserRepository } from "../../domain/users.repository";

@Injectable()
export class VerifyEmailUseCase {
	constructor(
		@Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository
	) {}

	async execute(token: string): Promise<void> {
		const user = await this.userRepository.findByVerificationToken(token)

		if (!user){
			throw new BadRequestException('Token de verificacion invalido o expirado')
		}

		// caso de que ya este verificado
		if(user.emailVerified){
			throw new BadRequestException('El correo ya ha sido verificado')
		}		

		user.emailVerified = true
		user.emailVerifiedAt = new Date()
		user.emailVerificationToken = null

		await this.userRepository.save(user)

	}
}

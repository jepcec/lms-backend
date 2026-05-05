import { Injectable, Inject } from "@nestjs/common";
import { I_USER_REPOSITORY } from "../../domain/users.repository";
import type { IUserRepository } from "../../domain/users.repository";
import { RegisterUserDto } from "../dtos/register-user.dto";
import { UserEntity } from "../../domain/user.entity";
import { I_PASSWORD_SERVICE, type IPasswordService } from "../../domain/services/auth.service";

@Injectable()
export class RegisterUserUseCase{
	constructor(
		@Inject(I_USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		@Inject(I_PASSWORD_SERVICE)
		private readonly passwordService: IPasswordService
	){ }

	async execute(dto: RegisterUserDto){
		const {first_name, last_name, email, phone, password} = dto	
		const usuarioExiste = await this.userRepository.findByEmail(email)
		if(usuarioExiste){
			throw new Error("El usuario ya existe")
		}
		
		const hashed = await this.passwordService.hash(password)

		const nuevoUsuario = new UserEntity({
			id: crypto.randomUUID(),
			first_name,
			last_name, 
			email, 
			phone, 
			passwordHash: hashed, 
			role: 'estudiante' 
		})

		await this.userRepository.save(nuevoUsuario)
		return {mensaje: "Usuario registrado con exito"}

	}
}


// notes
// - sobre el id puede ser generado en backend o por la base de datos

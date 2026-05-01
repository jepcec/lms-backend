import { Injectable, Inject } from "@nestjs/common";
import { I_USER_REPOSITORY } from "../../domain/users.repository";
import type { IUserRepository } from "../../domain/users.repository";
import { RegisterUserDto } from "../dtos/register-user.dto";
import { UserEntity } from "../../domain/user.entity";


export class RegisterUserUseCase{
	constructor(
		@Inject(I_USER_REPOSITORY)
		private readonly userRepository: IUserRepository
	){ }

	async execute(dto: RegisterUserDto){
		const {fullName, email, phone, passwordHash, role} = dto	
		const usuarioExiste = await this.userRepository.findByEmail(email)
		if(usuarioExiste){
			throw new Error("El usuario ya existe")
		}

		const nuevoUsuario = new UserEntity({
			id: crypto.randomUUID(),
			fullName, email, phone, passwordHash, role: role as any
		})
		await this.userRepository.save(nuevoUsuario)
		return {mensaje: "Usuario registrado con exito"}

	}
}


// notes
// - sobre el id puede ser generado en backend o por la base de datos

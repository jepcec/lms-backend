import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../domain/users.repository";
import { PrismaService } from "src/core/database/prisma.service";
import { UserEntity } from "../../domain/user.entity";


@Injectable()
export class PrismaUserRepository implements IUserRepository {
	constructor(private readonly prisma: PrismaService){}

	async findByEmail(email: string): Promise<UserEntity | null> {
		const dbUser = await this.prisma.user.findUnique({where:{email}})
		if (!dbUser) return null

		return new UserEntity({
			id: dbUser.id,
			first_name: dbUser.first_name,
			last_name: dbUser.last_name,
			email:dbUser.email,
			phone:dbUser.phone,
			passwordHash: dbUser.password_hash,
			role: dbUser.role as any
		})
	    
	}
		
	async findById(id: string): Promise<UserEntity | null> {
		const dbUser = await this.prisma.user.findUnique({where:{id}})
		if (!dbUser) return null

		return new UserEntity({
			id: dbUser.id,
			first_name: dbUser.first_name,
			last_name: dbUser.last_name,
			email:dbUser.email,
			phone:dbUser.phone,
			passwordHash: dbUser.password_hash,
			role: dbUser.role as any
		})
	    
	}

	async save(user: UserEntity): Promise<void> {
		await this.prisma.user.upsert({
			where: {id: user.id},
			update: {
				first_name: user.fullName,
				last_name: user.lastName,
				email:user.email,
				phone:user.fullName,
				role: user.role
			},
			create: {
				first_name: user.fullName,
				last_name: user.lastName,
				email:user.email,
				phone:user.fullName,
				password_hash: user.passwordHash,
				role: user.role 
			}

		})
	}
	

}

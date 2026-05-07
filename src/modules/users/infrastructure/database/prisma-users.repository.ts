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
			role: dbUser.role as any,
			email_verified: dbUser.email_verified
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
			role: dbUser.role as any,
			email_verified: dbUser.email_verified
		})
	    
	}

	async findByVerificationToken(token: string): Promise<UserEntity | null> {
		const dbUser = await this.prisma.user.findFirst({
		    where: {email_verification_token: token}
		})
		if(!dbUser){return null}
		return new UserEntity({
			id: dbUser.id,
			first_name: dbUser.first_name,
			last_name: dbUser.last_name,
			email:dbUser.email,
			phone:dbUser.phone,
			passwordHash: dbUser.password_hash,
			role: dbUser.role as any,

			email_verification_token: dbUser.email_verification_token,
			email_verified: dbUser.email_verified,
			email_verified_at: dbUser.email_verified_at,

		})

	}
	
	async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
		const dbUser = await this.prisma.user.findFirst({
		    where: {password_reset_token: token}
		})
		if(!dbUser){return null}
		return new UserEntity({
			id: dbUser.id,
			first_name: dbUser.first_name,
			last_name: dbUser.last_name,
			email:dbUser.email,
			phone:dbUser.phone,
			passwordHash: dbUser.password_hash,
			role: dbUser.role as any,
			email_verification_token: dbUser.email_verification_token,
			email_verified: dbUser.email_verified,
			password_reset_token: dbUser.password_reset_token,
			password_reset_expires_at: dbUser.password_reset_expires_at
		})
	}
	// diferentes saves para update o create
	async save(user: UserEntity): Promise<void> {
		await this.prisma.user.upsert({
			where: {id: user.id},
			update: {
				first_name: user.first_name,
				last_name: user.lastName,
				email:user.email,
				phone:user.phone,
				role: user.role,

				email_verified: user.emailVerified,
				email_verified_at: user.emailVerifiedAt,
				email_verification_token: user.emailVerificationToken,
				password_reset_expires_at: user.passwordResetExpiresAt,
				password_reset_token: user.passwordResetToken
			},
			create: {
				first_name: user.first_name,
				last_name: user.lastName,
				email:user.email,
				phone:user.phone,
				password_hash: user.passwordHash,
				role: user.role 
			}

		})
	}
	

}

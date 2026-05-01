import { Module } from "@nestjs/common";
import { I_USER_REPOSITORY } from "./domain/users.repository";
import { PrismaUserRepository } from "./infrastructure/database/prisma-users.repository";
import { UsersController } from "./infrastructure/routes/users.controller";
import { PrismaService } from "src/core/database/prisma.service";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";


@Module({
	imports:[],
	controllers:[UsersController],
	providers:[
		PrismaService,
		RegisterUserUseCase,
		{
			provide: I_USER_REPOSITORY,
			useClass: PrismaUserRepository
		}
	]
})
export class UsersModule{}

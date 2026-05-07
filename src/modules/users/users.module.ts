import { Module } from "@nestjs/common";
import { I_USER_REPOSITORY } from "./domain/users.repository";
import { PrismaUserRepository } from "./infrastructure/database/prisma-users.repository";
import { UsersController } from "./infrastructure/routes/users.controller";
import { PrismaService } from "src/core/database/prisma.service";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { I_AUTH_TOKEN_SERVICE, I_PASSWORD_SERVICE } from "./domain/services/auth.service";
import { PasswordService } from "./infrastructure/services/auth-password.service";
import { TokenService } from "./infrastructure/services/auth-token.service";
import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./infrastructure/routes/auth.controller";
import { I_EMAIL_SERVICE } from "./domain/services/email.service";
import { NodemailerEmailService } from "./infrastructure/services/nodemailer.service";


@Module({
	imports:[
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('JWT_SECRET'),
				signOptions: {expiresIn: '1d'},
			})
		}),
		ConfigModule
	],
	controllers:[UsersController, AuthController],
	providers:[
		
		PrismaService,
		LoginUserUseCase,
		RegisterUserUseCase,
		{provide: I_USER_REPOSITORY, useClass: PrismaUserRepository},
		{provide: I_PASSWORD_SERVICE, useClass: PasswordService },
		{provide: I_AUTH_TOKEN_SERVICE, useClass: TokenService},
		{provide: I_EMAIL_SERVICE, useClass: NodemailerEmailService}
	]
})
export class UsersModule{}


// agregar mas providers
// agregar valore de .env de nodemailer

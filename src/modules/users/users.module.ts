// src/modules/users/users.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

// Repositories & Services Interfaces
import { I_USER_REPOSITORY } from "./domain/users.repository";
import { I_AUTH_TOKEN_SERVICE, I_PASSWORD_SERVICE } from "./domain/services/auth.service";
import { I_EMAIL_SERVICE } from "./domain/services/email.service";

// Infrastructure Implementations
import { PrismaUserRepository } from "./infrastructure/database/prisma-users.repository";
import { PrismaService } from '../../core/database/prisma.service';
import { PasswordService } from "./infrastructure/services/auth-password.service";
import { TokenService } from "./infrastructure/services/auth-token.service";
import { NodemailerEmailService } from "./infrastructure/services/nodemailer.service";
import { CryptoTokenService } from "./infrastructure/services/crypto-token.service";

// Controllers
import { UsersController } from "./infrastructure/routes/users.controller";
import { AuthController } from "./infrastructure/routes/auth.controller";
import { StudentController } from "./infrastructure/routes/student.controller";
import { AdminController } from "./infrastructure/routes/admin.controller";

// Use Cases
import { LoginUserUseCase } from "./application/use-cases/login-user.use-case";
import { RegisterUserUseCase } from "./application/use-cases/register-user.use-case";
import { RequestPasswordResetUseCase } from "./application/use-cases/request-password-reset.use-case";
import { ResetPasswordUseCase } from "./application/use-cases/reset-password.use-case";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.use-case";
import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { DeleteAccountUseCase } from "./application/use-cases/delete-user.use-case";
import { SetGradeUseCase } from "./application/use-cases/set-enrollment-grade.use-case";
import { GetMyEnrollmentsUseCase } from "./application/use-cases/get-my-enrollments.use-case";
import { GetCourseContentUseCase } from "./application/use-cases/get-course-content.use-case";
import { GetCourseProgressUseCase } from "./application/use-cases/get-course-progress.use-case";
import { UpdateSessionProgressUseCase } from "./application/use-cases/update-session-progress.use-case";
import { ListUsuariosUseCase } from "./application/use-cases/list-usuarios.use-case";
import { GetDashboardStatsUseCase } from "./application/use-cases/get-dashboard-stats.use-case";
import { GetAuditLogsUseCase } from "./application/use-cases/get-audit-logs.use-case";
import { GetIngresosChartUseCase } from "./application/use-cases/get-ingresos-chart.use-case";
import { GetTopCursosUseCase } from "./application/use-cases/get-top-cursos.use-case";
import { GetCategoriasDistribucionUseCase } from "./application/use-cases/get-categorias-distribucion.use-case";
import { GetEstudiantesActivosUseCase } from "./application/use-cases/get-estudiantes-activos.use-case";
import { GetTopFinalizacionUseCase } from "./application/use-cases/get-top-finalizacion.use-case";
import { GetTopEstudiantesUseCase } from "./application/use-cases/get-top-estudiantes.use-case";
import { GetMatriculadosCursoUseCase } from "./application/use-cases/get-matriculados-curso.use-case";
import { GetActividadEstudianteUseCase } from "./application/use-cases/get-actividad-estudiante.use-case";
import { GetUsuarioUseCase } from "./application/use-cases/get-usuario.use-case";
import { CreateUsuarioUseCase } from "./application/use-cases/create-usuario.use-case";
import { UpdateUsuarioUseCase } from "./application/use-cases/update-usuario.use-case";
import { SuspendUsuarioUseCase } from "./application/use-cases/suspend-usuario.use-case";
import { ActivateUsuarioUseCase } from "./application/use-cases/activate-usuario.use-case";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            })
        }),
        ConfigModule
    ],
    controllers: [UsersController, AuthController, StudentController, AdminController],
    providers: [
        PrismaService,
        // Use Cases
        LoginUserUseCase,
        RegisterUserUseCase,
        RequestPasswordResetUseCase,
        ResetPasswordUseCase,
        VerifyEmailUseCase,
        GetProfileUseCase,
        UpdateProfileUseCase,
        DeleteAccountUseCase,
        SetGradeUseCase,
        GetMyEnrollmentsUseCase,
        GetCourseContentUseCase,
        GetCourseProgressUseCase,
        UpdateSessionProgressUseCase,
        ListUsuariosUseCase,
        GetDashboardStatsUseCase,
        GetAuditLogsUseCase,
        GetIngresosChartUseCase,
        GetTopCursosUseCase,
        GetCategoriasDistribucionUseCase,
        GetEstudiantesActivosUseCase,
        GetTopFinalizacionUseCase,
        GetTopEstudiantesUseCase,
        GetMatriculadosCursoUseCase,
        GetActividadEstudianteUseCase,
        GetUsuarioUseCase,
        CreateUsuarioUseCase,
        UpdateUsuarioUseCase,
        SuspendUsuarioUseCase,
        ActivateUsuarioUseCase,
        CryptoTokenService,
        // Interface Mappings
        { provide: I_USER_REPOSITORY, useClass: PrismaUserRepository },
        { provide: I_PASSWORD_SERVICE, useClass: PasswordService },
        { provide: I_AUTH_TOKEN_SERVICE, useClass: TokenService },
        { provide: I_EMAIL_SERVICE, useClass: NodemailerEmailService },
    ],
    exports: [
	    I_USER_REPOSITORY,
	    I_AUTH_TOKEN_SERVICE,
    ]
})
export class UsersModule {}

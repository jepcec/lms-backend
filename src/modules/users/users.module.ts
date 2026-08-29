// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';

// Repositories & Services Interfaces
import { I_USER_REPOSITORY } from './domain/users.repository';
import {
  I_AUTH_TOKEN_SERVICE,
  I_PASSWORD_SERVICE,
} from './domain/services/auth.service';
import { I_EMAIL_SERVICE } from './domain/services/email.service';

// Infrastructure Implementations
import { PrismaUserRepository } from './infrastructure/database/prisma-users.repository';
import { PasswordService } from './infrastructure/services/auth-password.service';
import { TokenService } from './infrastructure/services/auth-token.service';
import { NodemailerEmailService } from './infrastructure/services/nodemailer.service';
import { CryptoTokenService } from './infrastructure/services/crypto-token.service';
import { TurnstileService } from './infrastructure/services/turnstile.service';
import { TurnstileGuard } from './infrastructure/guards/turnstile.guard';

// Controllers
import { UsersController } from './infrastructure/routes/users.controller';
import { AuthController } from './infrastructure/routes/auth.controller';
import { StudentController } from './infrastructure/routes/student.controller';
import { AdminController } from './infrastructure/routes/admin.controller';
import { EnrollmentsController } from './infrastructure/routes/enrollments.controller';
import { CertificateTemplatesController } from './infrastructure/routes/certificate-templates.controller';
import { CertificatesController } from './infrastructure/routes/certificates.controller';
import { PublicCertificatesController } from './infrastructure/routes/public-certificates.controller';
import { ReviewsController } from './infrastructure/routes/reviews.controller';
import { SubmitReviewUseCase } from './application/use-cases/submit-review.use-case';

// Use Cases
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { DeleteAccountUseCase } from './application/use-cases/delete-user.use-case';
import { SetGradeUseCase } from './application/use-cases/set-enrollment-grade.use-case';
import { GetMyEnrollmentsUseCase } from './application/use-cases/get-my-enrollments.use-case';
import { GetCourseContentUseCase } from './application/use-cases/get-course-content.use-case';
import { GetCourseProgressUseCase } from './application/use-cases/get-course-progress.use-case';
import { UpdateSessionProgressUseCase } from './application/use-cases/update-session-progress.use-case';
import { ListUsuariosUseCase } from './application/use-cases/list-usuarios.use-case';
import { GetDashboardStatsUseCase } from './application/use-cases/get-dashboard-stats.use-case';
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs.use-case';
import { GetIngresosChartUseCase } from './application/use-cases/get-ingresos-chart.use-case';
import { GetTopCursosUseCase } from './application/use-cases/get-top-cursos.use-case';
import { GetCategoriasDistribucionUseCase } from './application/use-cases/get-categorias-distribucion.use-case';
import { GetEstudiantesActivosUseCase } from './application/use-cases/get-estudiantes-activos.use-case';
import { GetTopFinalizacionUseCase } from './application/use-cases/get-top-finalizacion.use-case';
import { GetTopEstudiantesUseCase } from './application/use-cases/get-top-estudiantes.use-case';
import { GetMatriculadosCursoUseCase } from './application/use-cases/get-matriculados-curso.use-case';
import { GetActividadEstudianteUseCase } from './application/use-cases/get-actividad-estudiante.use-case';
import { GetUsuarioUseCase } from './application/use-cases/get-usuario.use-case';
import { CreateUsuarioUseCase } from './application/use-cases/create-usuario.use-case';
import { UpdateUsuarioUseCase } from './application/use-cases/update-usuario.use-case';
import { SuspendUsuarioUseCase } from './application/use-cases/suspend-usuario.use-case';
import { ActivateUsuarioUseCase } from './application/use-cases/activate-usuario.use-case';
import { ListMatriculasUseCase } from './application/use-cases/list-matriculas.use-case';
import { CreateMatriculasUseCase } from './application/use-cases/create-matriculas.use-case';
import { BuscarUsuariosUseCase } from './application/use-cases/buscar-usuarios.use-case';
import { ListCertificateTemplatesUseCase } from './application/use-cases/list-certificate-templates.use-case';
import { GetCertificateTemplateUseCase } from './application/use-cases/get-certificate-template.use-case';
import { CreateCertificateTemplateUseCase } from './application/use-cases/create-certificate-template.use-case';
import { UpdateCertificateTemplateUseCase } from './application/use-cases/update-certificate-template.use-case';
import { ActivateCertificateTemplateUseCase } from './application/use-cases/activate-certificate-template.use-case';
import { DeleteCertificateTemplateUseCase } from './application/use-cases/delete-certificate-template.use-case';
import { GetMyCertificatesUseCase } from './application/use-cases/get-my-certificates.use-case';
import { GetCertificateUseCase } from './application/use-cases/get-certificate.use-case';
import { GetStudentCertificateUseCase } from './application/use-cases/get-student-certificate.use-case';
import { VerifyCertificateUseCase } from './application/use-cases/verify-certificate.use-case';
import { CertificatePdfService } from '../cources/application/services/certificate-pdf.service';
import { GetStudentDetailUseCase } from './application/use-cases/get-student-detail.use-case';
import { DeleteEnrollmentUseCase } from './application/use-cases/delete-enrollment.use-case';
import { ExportMatriculadosCursoExcelUseCase } from './application/use-cases/export-matriculados-curso-excel.use-case';
import { ExportDashboardExcelUseCase } from './application/use-cases/export-dashboard-excel.use-case';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    ConfigModule,
    StorageModule,
  ],
  controllers: [
    UsersController,
    AuthController,
    StudentController,
    AdminController,
    EnrollmentsController,
    CertificateTemplatesController,
    CertificatesController,
    PublicCertificatesController,
    ReviewsController,
  ],
  providers: [
    // Use Cases
    LoginUserUseCase,
    RegisterUserUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
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
    ListMatriculasUseCase,
    CreateMatriculasUseCase,
    BuscarUsuariosUseCase,
    ListCertificateTemplatesUseCase,
    GetCertificateTemplateUseCase,
    CreateCertificateTemplateUseCase,
    UpdateCertificateTemplateUseCase,
    ActivateCertificateTemplateUseCase,
    DeleteCertificateTemplateUseCase,
    GetMyCertificatesUseCase,
    GetCertificateUseCase,
    GetStudentCertificateUseCase,
    VerifyCertificateUseCase,
    CertificatePdfService,
    SubmitReviewUseCase,
    GetStudentDetailUseCase,
    DeleteEnrollmentUseCase,
    ExportMatriculadosCursoExcelUseCase,
    ExportDashboardExcelUseCase,
    CryptoTokenService,
    TurnstileService,
    TurnstileGuard,
    // Interface Mappings
    { provide: I_USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: I_PASSWORD_SERVICE, useClass: PasswordService },
    { provide: I_AUTH_TOKEN_SERVICE, useClass: TokenService },
    { provide: I_EMAIL_SERVICE, useClass: NodemailerEmailService },
  ],
  exports: [I_USER_REPOSITORY, I_AUTH_TOKEN_SERVICE],
})
export class UsersModule {}

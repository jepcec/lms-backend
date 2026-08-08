import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { GetMyEnrollmentsUseCase } from '../../application/use-cases/get-my-enrollments.use-case';
import { GetCourseContentUseCase } from '../../application/use-cases/get-course-content.use-case';
import { GetCourseProgressUseCase } from '../../application/use-cases/get-course-progress.use-case';
import { UpdateSessionProgressUseCase } from '../../application/use-cases/update-session-progress.use-case';
import { GetMyCertificatesUseCase } from '../../application/use-cases/get-my-certificates.use-case';
import { GetStudentCertificateUseCase } from '../../application/use-cases/get-student-certificate.use-case';
// 🚀 CAMBIO 1: Importamos el PrismaService (Verifica la ruta relativa de tus carpetas si es necesario)
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('student')
@Roles('estudiante')
export class StudentController {
  constructor(
    private readonly getMyEnrollments: GetMyEnrollmentsUseCase,
    private readonly getCourseContent: GetCourseContentUseCase,
    private readonly getCourseProgress: GetCourseProgressUseCase,
    private readonly updateSessionProgress: UpdateSessionProgressUseCase,
    private readonly getMyCertificates: GetMyCertificatesUseCase,
    private readonly getStudentCertificate: GetStudentCertificateUseCase,
    // 🚀 CAMBIO 2: Inyectamos Prisma en el constructor para tener acceso directo a la BD
    private readonly prisma: PrismaService,
  ) {}

  @Get('enrollments')
  async getMyEnrollmentsHandler(@CurrentUser('userId') userId: string) {
    return await this.getMyEnrollments.execute(userId);
  }

  @Get('courses/:courseId/content')
  async getCourseContentHandler(
    @CurrentUser('userId') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    // 🚀 CAMBIO 3: Escudo de Auto-Matrícula Real para el Temario
    // Buscamos si el alumno ya tiene la fila en Postgres usando el índice único compuesto
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    });

    // Si no existe, la creamos físicamente en este instante antes de pasar al caso de uso
    if (!enrollment) {
      console.log(
        `⚡ [AUTO-MATRÍCULA] Generando inscripción en Postgres para courseId: ${courseId}`,
      );
      await this.prisma.enrollment.create({
        data: {
          user_id: userId,
          course_id: courseId,
          enrollment_type: 'online',
          progress_percent: 0,
        },
      });

      // Incrementamos el contador de alumnos del curso
      await this.prisma.course.update({
        where: { id: courseId },
        data: { enrolled_count: { increment: 1 } },
      });
    }

    return await this.getCourseContent.execute(userId, courseId);
  }

  @Get('progress/courses/:courseId')
  async getCourseProgressHandler(
    @CurrentUser('userId') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    // 🚀 CAMBIO 4: Escudo de Auto-Matrícula Real para el Progreso
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    });

    if (!enrollment) {
      await this.prisma.enrollment.create({
        data: {
          user_id: userId,
          course_id: courseId,
          enrollment_type: 'online',
          progress_percent: 0,
        },
      });
    }

    return await this.getCourseProgress.execute(userId, courseId);
  }

  @Get('certificates')
  getMyCertificatesHandler(@CurrentUser('userId') userId: string) {
    return this.getMyCertificates.execute(userId);
  }

  @Get('certificates/:enrollmentId')
  getStudentCertificateHandler(
    @CurrentUser('userId') userId: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.getStudentCertificate.execute(enrollmentId, userId);
  }

  @Get('orders/verify/:orderId')
  async verifyOrderStatus(
    @CurrentUser('userId') userId: string,
    @Param('orderId') orderId: string,
  ) {
    // Buscamos si existe una matrícula real creada para este usuario vinculada indirectamente al carrito/curso
    // O si tu tabla Order ya pasó a estado 'paid'
    const enrollments = await this.prisma.enrollment.findMany({
      where: { 
        user_id: userId,
        // Si no tienes order_id guardado por ser demo, podemos buscar las últimas del usuario
      },
      include: { course: true }
    });

    return {
      success: enrollments.length > 0,
      enrollments
    };
  }

  @Put('progress/sessions/:sessionId')
  async updateSessionProgressHandler(
    @CurrentUser('userId') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body('watched_seconds') watchedSeconds: number,
    @Body('force_complete') forceComplete: boolean,
  ) {
    return this.updateSessionProgress.execute(
      userId,
      sessionId,
      watchedSeconds ?? 0,
      forceComplete ?? false,
    );
  }
}

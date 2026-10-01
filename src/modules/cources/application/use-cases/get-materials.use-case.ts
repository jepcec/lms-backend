import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

const STAFF_ROLES = ['admin', 'soporte'];

@Injectable()
export class GetMaterialsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // Los materiales son contenido pagado: el staff que edita cursos los ve
  // siempre; un alumno solo si tiene matrícula vigente en el curso de la sesión
  // (mismas reglas que get-course-content).
  async executeBySession(
    sessionId: string,
    user: { userId: string; role: string },
  ) {
    if (!STAFF_ROLES.includes(user.role)) {
      await this.assertActiveEnrollment(sessionId, user.userId);
    }

    const materials = await this.prisma.material.findMany({
      where: { session_id: sessionId },
    });
    return materials.map((m) => ({
      id: m.id,
      name: m.name,
      drive_url: m.drive_url,
      type: m.type,
    }));
  }

  private async assertActiveEnrollment(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { module: { select: { course_id: true } } },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: session.module.course_id,
        },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('No estás matriculado en este curso');
    }
    if (enrollment.suspended_at) {
      throw new ForbiddenException('Tu acceso a este curso ha sido suspendido');
    }
    if (enrollment.access_expires_at && enrollment.access_expires_at < new Date()) {
      throw new ForbiddenException('Tu acceso a este curso ha vencido');
    }
  }
}

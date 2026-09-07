import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCourseContentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
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

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { display_order: 'asc' },
          include: {
            sessions: {
              orderBy: { display_order: 'asc' },
              include: {
                materials: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return {
      id: course.id,
      title: course.title,
      modules: course.modules.map((mod) => ({
        id: mod.id,
        course_id: mod.course_id,
        title: mod.title,
        description: mod.description,
        display_order: mod.display_order,
        created_at: mod.created_at.toISOString(),
        sessions: mod.sessions.map((ses) => ({
          id: ses.id,
          module_id: ses.module_id,
          title: ses.title,
          description: ses.description,
          youtube_url: ses.youtube_url,
          youtube_video_id: ses.youtube_video_id,
          duration_minutes: ses.duration_minutes,
          display_order: ses.display_order,
          created_at: ses.created_at.toISOString(),
          materials: ses.materials.map((mat) => ({
            id: mat.id,
            session_id: mat.session_id,
            name: mat.name,
            drive_url: mat.drive_url,
            type: mat.type,
            created_at: mat.created_at.toISOString(),
          })),
        })),
      })),
    };
  }
}

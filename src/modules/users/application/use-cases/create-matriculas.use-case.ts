import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateMatriculasDto } from '../dtos/create-matriculas.dto';
import { EnrollmentCreatedEvent } from '../../../notifications/domain/events/enrollment-created.event';

@Injectable()
export class CreateMatriculasUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateMatriculasDto, actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.user_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const validCourses = await this.prisma.course.findMany({
      where: {
        id: { in: dto.course_ids },
        deleted_at: null,
      },
      select: { id: true },
    });

    if (validCourses.length === 0) {
      throw new BadRequestException('Ningún curso válido encontrado');
    }

    const validCourseIds = validCourses.map((c) => c.id);

    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: {
        user_id: dto.user_id,
        course_id: { in: validCourseIds },
      },
      select: { course_id: true },
    });

    const existingCourseIds = new Set(
      existingEnrollments.map((e) => e.course_id),
    );
    const toCreate = validCourseIds.filter((id) => !existingCourseIds.has(id));

    if (toCreate.length === 0) {
      throw new BadRequestException(
        'El usuario ya está matriculado en todos los cursos seleccionados',
      );
    }

    const created = await this.prisma.$transaction(
      toCreate.map((courseId) =>
        this.prisma.enrollment.create({
          data: {
            user_id: dto.user_id,
            course_id: courseId,
            enrollment_type: 'manual',
            offline_payment_method: dto.offline_payment_method,
            offline_amount: dto.offline_amount,
            internal_notes: dto.internal_notes,
          },
          include: {
            student: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                country: true,
                role: true,
                profile_photo_url: true,
                email_verified: true,
                status: true,
                created_by: true,
                created_at: true,
                updated_at: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail_url: true,
                level: true,
                total_duration_minutes: true,
              },
            },
          },
        }),
      ),
    );

    // Actualizar enrolled_count en cada curso matriculado
    await Promise.all(
      toCreate.map((courseId) =>
        this.prisma.course.update({
          where: { id: courseId },
          data: { enrolled_count: { increment: 1 } },
        }),
      ),
    );

    await Promise.all(
      created.map((enrollment) =>
        this.prisma.auditLog.create({
          data: {
            user_id: actorUserId,
            entity_type: 'Enrollment',
            entity_id: enrollment.id,
            action: 'create',
            changes: {
              before: null,
              after: {
                user_id: enrollment.user_id,
                student: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
                course_id: enrollment.course_id,
                course: enrollment.course.title,
                enrollment_type: enrollment.enrollment_type,
                offline_payment_method: enrollment.offline_payment_method,
                offline_amount: enrollment.offline_amount
                  ? Number(enrollment.offline_amount)
                  : null,
              },
            },
          },
        }),
      ),
    );

    for (const enrollment of created) {
      this.eventEmitter.emit(
        EnrollmentCreatedEvent.EVENT,
        new EnrollmentCreatedEvent(
          enrollment.user_id,
          enrollment.course_id,
          enrollment.course.title,
          enrollment.course.slug,
        ),
      );
    }

    const skipped = dto.course_ids.length - toCreate.length;

    return {
      data: created.map((enrollment) => ({
        id: enrollment.id,
        user_id: enrollment.user_id,
        user: enrollment.student,
        course_id: enrollment.course_id,
        course: enrollment.course,
        enrolled_at: enrollment.enrolled_at.toISOString(),
        enrollment_type: enrollment.enrollment_type,
        offline_payment_method: enrollment.offline_payment_method,
        offline_amount: enrollment.offline_amount
          ? Number(enrollment.offline_amount)
          : undefined,
        internal_notes: enrollment.internal_notes,
        progress_percent: Number(enrollment.progress_percent),
      })),
      skipped,
      message: `${created.length} matrícula(s) creada(s), ${skipped} ya existente(s)`,
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { renewedExpiry } from '../../../orders/application/services/course-access';

const MAX_MONTHS = 60;

/**
 * Renovación manual (pagos offline, cortesías): misma regla que la renovación
 * pagada online — los meses se suman a lo que le queda o, si ya venció, se
 * cuentan desde hoy. No toca la suspensión manual (suspended_at): son cosas
 * distintas y se reactiva aparte.
 */
@Injectable()
export class ExtendEnrollmentAccessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(enrollmentId: string, actorUserId: string, months?: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { first_name: true, last_name: true } },
        course: { select: { title: true, access_duration_months: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }
    if (!enrollment.access_expires_at) {
      throw new BadRequestException('Esta matrícula no tiene fecha de vencimiento.');
    }

    const monthsToAdd = months ?? enrollment.course.access_duration_months;
    if (!Number.isInteger(monthsToAdd) || monthsToAdd < 1 || monthsToAdd > MAX_MONTHS) {
      throw new BadRequestException(`Los meses deben ser un entero entre 1 y ${MAX_MONTHS}.`);
    }

    const accessExpiresAt = renewedExpiry(enrollment.access_expires_at, monthsToAdd);

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { access_expires_at: accessExpiresAt },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: actorUserId,
        entity_type: 'Enrollment',
        entity_id: enrollmentId,
        action: 'update',
        changes: {
          before: { access_expires_at: enrollment.access_expires_at },
          after: {
            access_expires_at: accessExpiresAt,
            months_added: monthsToAdd,
            student: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
            course: enrollment.course.title,
          },
        },
      },
    });

    return {
      message: 'Acceso extendido exitosamente',
      access_expires_at: accessExpiresAt.toISOString(),
    };
  }
}

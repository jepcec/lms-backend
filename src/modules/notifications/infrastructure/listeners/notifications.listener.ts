import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationUseCase } from '../../application/use-cases/create-notification.use-case';
import { EnrollmentCreatedEvent } from '../../domain/events/enrollment-created.event';
import { CourseCreatedEvent } from '../../domain/events/course-created.event';
import { CourseCompletedEvent } from '../../domain/events/course-completed.event';
import { CertificateIssuedEvent } from '../../domain/events/certificate-issued.event';
import { ReminderScheduledEvent } from '../../domain/events/reminder-scheduled.event';

@Injectable()
export class NotificationsListener {
  constructor(private readonly createNotification: CreateNotificationUseCase) {}

  @OnEvent(EnrollmentCreatedEvent.EVENT, { async: true })
  async handleEnrollmentCreated(event: EnrollmentCreatedEvent) {
    await this.createNotification.execute({
      user_id: event.userId,
      type: 'matriculacion',
      title: 'Matrícula confirmada',
      body: `Te matriculaste en "${event.courseTitle}". ¡Mucho éxito!`,
      redirect_url: `/cursos/${event.courseSlug}`,
    });
  }

  @OnEvent(CourseCreatedEvent.EVENT, { async: true })
  async handleCourseCreated(event: CourseCreatedEvent) {
    await this.createNotification.execute({
      user_id: event.userId,
      type: 'nuevo_curso',
      title: `Nuevo curso disponible: ${event.courseTitle}`,
      body: `Impartido por ${event.instructorName}. Inscríbete ahora.`,
      redirect_url: `/cursos/${event.courseSlug}`,
    });
  }

  @OnEvent(CourseCompletedEvent.EVENT, { async: true })
  async handleCourseCompleted(event: CourseCompletedEvent) {
    await this.createNotification.execute({
      user_id: event.userId,
      type: 'completado',
      title: '¡Has completado un curso!',
      body: `Terminaste "${event.courseTitle}". Tu certificado está en camino.`,
      redirect_url: `/cursos/${event.courseSlug}`,
    });
  }

  @OnEvent(CertificateIssuedEvent.EVENT, { async: true })
  async handleCertificateIssued(event: CertificateIssuedEvent) {
    await this.createNotification.execute({
      user_id: event.userId,
      type: 'certificado',
      title: 'Tu certificado está listo',
      body: `Certificado de "${event.courseTitle}" (código ${event.certificateCode}).`,
      redirect_url: `/certificados/${event.certificateId}`,
    });
  }

  @OnEvent(ReminderScheduledEvent.EVENT, { async: true })
  async handleReminderScheduled(event: ReminderScheduledEvent) {
    await this.createNotification.execute({
      user_id: event.userId,
      type: 'recordatorio',
      title: `Recordatorio: ${event.courseTitle}`,
      body: event.message,
      redirect_url: `/cursos/${event.courseSlug}`,
    });
  }
}

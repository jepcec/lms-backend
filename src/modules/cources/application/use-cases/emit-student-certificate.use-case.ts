import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../core/database/prisma.service';
import { EmitCertificateDto } from '../dtos/emit-certificate.dto';

export type EmitStudentCertificateDto = EmitCertificateDto;

const PASSING_GRADE = 14;

@Injectable()
export class EmitStudentCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string, dto: EmitStudentCertificateDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollment_id, course_id: courseId },
      include: { certificate: true },
    });

    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');

    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id: dto.template_id },
    });

    if (!template) throw new NotFoundException('Plantilla no encontrada');

    // Las constancias no llevan código de verificación (sin QR ni página pública)
    let result: { id: string; type: string; action: string };

    if (enrollment.certificate) {
      // Actualizar tipo/plantilla (admin puede corregir)
      const updated = await this.prisma.certificate.update({
        where: { enrollment_id: dto.enrollment_id },
        data: {
          type: dto.type,
          template_id: dto.template_id,
          verification_code:
            dto.type === 'Certificado'
              ? (enrollment.certificate.verification_code ?? randomUUID())
              : null,
        },
      });
      result = { id: updated.id, type: updated.type, action: 'updated' };
    } else {
      const created = await this.prisma.certificate.create({
        data: {
          enrollment_id: dto.enrollment_id,
          template_id: dto.template_id,
          type: dto.type,
          verification_code: dto.type === 'Certificado' ? randomUUID() : null,
        },
      });
      result = { id: created.id, type: created.type, action: 'created' };
    }

    if (dto.type === 'Certificado') {
      await this.issueEligibleModuleCertificates(courseId, dto.enrollment_id);
    } else {
      // La Constancia anula cualquier certificado de módulo ya emitido.
      await this.prisma.moduleCertificate.deleteMany({
        where: { enrollment_id: dto.enrollment_id },
      });
    }

    return result;
  }

  async remove(courseId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, course_id: courseId },
      include: { certificate: true },
    });

    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');
    if (!enrollment.certificate) {
      throw new BadRequestException(
        'Este estudiante no tiene certificado asignado',
      );
    }

    await this.prisma.certificate.delete({
      where: { enrollment_id: enrollmentId },
    });

    // Los certificados de módulo son un derivado del certificado de curso.
    await this.prisma.moduleCertificate.deleteMany({
      where: { enrollment_id: enrollmentId },
    });

    return { success: true };
  }

  /**
   * Emite (idempotente) un ModuleCertificate por cada módulo del curso que
   * tenga plantilla propia y cuya nota para esta matrícula sea aprobatoria.
   */
  private async issueEligibleModuleCertificates(
    courseId: string,
    enrollmentId: string,
  ) {
    const modules = await this.prisma.module.findMany({
      where: { course_id: courseId, certificate_template_id: { not: null } },
      select: { id: true, certificate_template_id: true },
    });
    if (modules.length === 0) return;

    const grades = await this.prisma.enrollmentModuleGrade.findMany({
      where: {
        enrollment_id: enrollmentId,
        module_id: { in: modules.map((m) => m.id) },
        grade: { gte: PASSING_GRADE },
      },
      select: { module_id: true },
    });

    const eligibleModuleIds = new Set(grades.map((g) => g.module_id));

    for (const module of modules) {
      if (!eligibleModuleIds.has(module.id)) continue;

      await this.prisma.moduleCertificate.upsert({
        where: {
          enrollment_id_module_id: {
            enrollment_id: enrollmentId,
            module_id: module.id,
          },
        },
        update: {
          template_id: module.certificate_template_id as string,
        },
        create: {
          enrollment_id: enrollmentId,
          module_id: module.id,
          template_id: module.certificate_template_id as string,
          verification_code: randomUUID(),
        },
      });
    }
  }
}

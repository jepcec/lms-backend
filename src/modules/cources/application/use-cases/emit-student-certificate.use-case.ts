import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { EmitCertificateDto } from '../dtos/emit-certificate.dto';

export type EmitStudentCertificateDto = EmitCertificateDto;

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

    if (enrollment.certificate) {
      // Actualizar tipo/plantilla (admin puede corregir) y marcar PDF como pendiente
      const updated = await this.prisma.certificate.update({
        where: { enrollment_id: dto.enrollment_id },
        data: {
          type: dto.type,
          template_id: dto.template_id,
          pdf_url: 'PENDIENTE_GENERACION_PDF',
        },
      });
      return { id: updated.id, type: updated.type, action: 'updated' };
    }

    const created = await this.prisma.certificate.create({
      data: {
        enrollment_id: dto.enrollment_id,
        template_id: dto.template_id,
        type: dto.type,
        pdf_url: 'PENDIENTE_GENERACION_PDF',
      },
    });

    return { id: created.id, type: created.type, action: 'created' };
  }

  async remove(courseId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, course_id: courseId },
      include: { certificate: true },
    });

    if (!enrollment) throw new NotFoundException('Matrícula no encontrada');
    if (!enrollment.certificate) {
      throw new BadRequestException('Este estudiante no tiene certificado asignado');
    }

    await this.prisma.certificate.delete({
      where: { enrollment_id: enrollmentId },
    });

    return { success: true };
  }
}

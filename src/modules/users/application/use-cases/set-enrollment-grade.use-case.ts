// modules/users/application/use-cases/set-enrollment-grade.use-case.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CertificateType } from '../../../../generated/prisma/client';

@Injectable()
export class SetGradeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(enrollmentId: string, score: number) {
    // 1. Buscar la matrícula y validar existencia
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    // Solución al error "possibly null"
    if (!enrollment) {
      throw new NotFoundException(
        `No se encontró la matrícula con ID: ${enrollmentId}`,
      );
    }

    // 2. Validar que el curso esté completado al 100% [cite: 18, 19]
    // Usamos .toNumber() porque progress_percent es Decimal en el schema
    if (enrollment.progress_percent.toNumber() < 100) {
      throw new BadRequestException(
        'El estudiante aún no completa el 100% del curso',
      );
    }

    // 3. Obtener la plantilla de certificado activa
    const activeTemplate = await this.prisma.certificateTemplate.findFirst({
      where: { is_active: true },
    });

    if (!activeTemplate) {
      throw new BadRequestException(
        'No hay una plantilla de certificado activa en el sistema',
      );
    }

    // 4. Determinar tipo de documento según la nota mínima (13)
    const type =
      score >= 13 ? CertificateType.Certificado : CertificateType.Constancia;

    // 5. Actualizar nota y emitir certificado/constancia
    return await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        final_score: score,
        certificate: {
          create: {
            type: type,
            template_id: activeTemplate.id,
            // Las constancias no llevan código de verificación (sin QR ni página pública)
            verification_code:
              type === CertificateType.Certificado ? randomUUID() : null,
          },
        },
      },
      include: {
        certificate: true,
        course: true, // Útil para tener el nombre del curso en la respuesta
      },
    });
  }
}

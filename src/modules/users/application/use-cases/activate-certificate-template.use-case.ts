import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ActivateCertificateTemplateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Plantilla de certificado no encontrada`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.certificateTemplate.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      return tx.certificateTemplate.update({
        where: { id },
        data: { is_active: true },
      });
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCertificateTemplateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Plantilla de certificado no encontrada`);
    }

    return template;
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteCertificateTemplateUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id },
      include: {
        courses: { select: { id: true } },
        constancia_courses: { select: { id: true } },
        modules: { select: { id: true } },
        certificates: { select: { id: true }, take: 1 },
        module_certificates: { select: { id: true }, take: 1 },
      },
    });

    if (!template) {
      throw new NotFoundException(`Plantilla de certificado no encontrada`);
    }

    const inUse =
      template.courses.length > 0 ||
      template.constancia_courses.length > 0 ||
      template.modules.length > 0 ||
      template.certificates.length > 0 ||
      template.module_certificates.length > 0;

    if (inUse) {
      throw new BadRequestException(
        'Esta plantilla está en uso (asignada a un curso, módulo, o ya usada en certificados emitidos) y no se puede eliminar. Desasígnala primero.',
      );
    }

    if (template.background_image_public_id) {
      await this.fileStorageService.delete(template.background_image_public_id);
    }
    if (template.back_image_public_id) {
      await this.fileStorageService.delete(template.back_image_public_id);
    }

    await this.prisma.certificateTemplate.delete({
      where: { id },
    });
  }
}

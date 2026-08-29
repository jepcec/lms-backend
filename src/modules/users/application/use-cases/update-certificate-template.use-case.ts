import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { UpdateCertificateTemplateDto } from '../dtos/update-certificate-template.dto';
import {
  buildCertificateTemplateKey,
  type CertificateTemplateOwnerType,
} from './certificate-template-key.util';

@Injectable()
export class UpdateCertificateTemplateUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateCertificateTemplateDto) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id },
      include: {
        courses: { select: { id: true } },
        constancia_courses: { select: { id: true } },
        modules: { select: { id: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Plantilla de certificado no encontrada`);
    }

    // El dueño se deriva de las relaciones existentes (una plantilla siempre
    // tiene un único dueño), para reconstruir la misma ruta determinística
    // que se usó al crearla y sobrescribir el archivo en vez de duplicarlo.
    let owner: { type: CertificateTemplateOwnerType; id: string } | null =
      null;
    if (template.courses[0]) {
      owner = { type: 'course_certificado', id: template.courses[0].id };
    } else if (template.constancia_courses[0]) {
      owner = { type: 'course_constancia', id: template.constancia_courses[0].id };
    } else if (template.modules[0]) {
      owner = { type: 'module', id: template.modules[0].id };
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.font_family) updateData.font_family = dto.font_family;
    if (dto.student_name_position)
      updateData.student_name_position = JSON.parse(dto.student_name_position);
    if (dto.qr_position) updateData.qr_position = JSON.parse(dto.qr_position);
    if (dto.qr_size !== undefined)
      updateData.qr_size = parseInt(String(dto.qr_size), 10);
    if (dto.font_sizes) updateData.font_sizes = JSON.parse(dto.font_sizes);

    if (dto.background_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.background_image.buffer,
        originalName: dto.background_image.originalname,
        mimetype: dto.background_image.mimetype,
        key: owner
          ? buildCertificateTemplateKey(owner.type, owner.id, 'front')
          : undefined,
        folder: 'certificate-templates',
      });
      updateData.background_image_url = this.fileStorageService.getUrl(
        result.publicId,
        { format: 'png' },
      );
      updateData.background_image_public_id = result.publicId;
    }

    if (dto.back_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.back_image.buffer,
        originalName: dto.back_image.originalname,
        mimetype: dto.back_image.mimetype,
        key: owner
          ? buildCertificateTemplateKey(owner.type, owner.id, 'back')
          : undefined,
        folder: 'certificate-templates',
      });
      updateData.back_image_url = this.fileStorageService.getUrl(
        result.publicId,
        { format: 'png' },
      );
      updateData.back_image_public_id = result.publicId;
    }

    return this.prisma.certificateTemplate.update({
      where: { id },
      data: updateData,
    });
  }
}

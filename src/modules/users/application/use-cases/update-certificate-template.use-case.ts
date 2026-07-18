import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { UpdateCertificateTemplateDto } from '../dtos/update-certificate-template.dto';

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
    });

    if (!template) {
      throw new NotFoundException(`Plantilla de certificado no encontrada`);
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
        folder: 'certificate-templates',
      });
      updateData.background_image_url = this.fileStorageService.getUrl(
        result.publicId,
        { format: 'png' },
      );
    }

    if (dto.back_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.back_image.buffer,
        originalName: dto.back_image.originalname,
        mimetype: dto.back_image.mimetype,
        folder: 'certificate-templates',
      });
      updateData.back_image_url = this.fileStorageService.getUrl(
        result.publicId,
        { format: 'png' },
      );
    }

    return this.prisma.certificateTemplate.update({
      where: { id },
      data: updateData,
    });
  }
}

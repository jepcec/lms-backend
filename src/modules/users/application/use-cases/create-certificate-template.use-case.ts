import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { CreateCertificateTemplateDto } from '../dtos/create-certificate-template.dto';

@Injectable()
export class CreateCertificateTemplateUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateCertificateTemplateDto) {
    let backgroundImageUrl = '';
    let backImageUrl: string | null = null;

    if (dto.background_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.background_image.buffer,
        originalName: dto.background_image.originalname,
        mimetype: dto.background_image.mimetype,
        folder: 'certificate-templates',
      });
      backgroundImageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'png',
      });
    }

    if (dto.back_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.back_image.buffer,
        originalName: dto.back_image.originalname,
        mimetype: dto.back_image.mimetype,
        folder: 'certificate-templates',
      });
      backImageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'png',
      });
    }

    return this.prisma.certificateTemplate.create({
      data: {
        name: dto.name,
        background_image_url: backgroundImageUrl,
        back_image_url: backImageUrl,
        student_name_position: JSON.parse(dto.student_name_position),
        qr_position: JSON.parse(dto.qr_position),
        qr_size: dto.qr_size ? parseInt(dto.qr_size, 10) : 300,
        font_family: dto.font_family,
        font_sizes: JSON.parse(dto.font_sizes),
      },
    });
  }
}

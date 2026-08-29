import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { CreateCertificateTemplateDto } from '../dtos/create-certificate-template.dto';
import { buildCertificateTemplateKey } from './certificate-template-key.util';

@Injectable()
export class CreateCertificateTemplateUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateCertificateTemplateDto) {
    if (dto.owner_type === 'module') {
      const module = await this.prisma.module.findUnique({
        where: { id: dto.owner_id },
      });
      if (!module) throw new NotFoundException('Módulo no encontrado');
    } else {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.owner_id },
      });
      if (!course) throw new NotFoundException('Curso no encontrado');
    }

    let backgroundImageUrl = '';
    let backgroundImagePublicId: string | null = null;
    let backImageUrl: string | null = null;
    let backImagePublicId: string | null = null;

    if (dto.background_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.background_image.buffer,
        originalName: dto.background_image.originalname,
        mimetype: dto.background_image.mimetype,
        key: buildCertificateTemplateKey(dto.owner_type, dto.owner_id, 'front'),
      });
      backgroundImageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'png',
      });
      backgroundImagePublicId = result.publicId;
    }

    if (dto.back_image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.back_image.buffer,
        originalName: dto.back_image.originalname,
        mimetype: dto.back_image.mimetype,
        key: buildCertificateTemplateKey(dto.owner_type, dto.owner_id, 'back'),
      });
      backImageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'png',
      });
      backImagePublicId = result.publicId;
    }

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.certificateTemplate.create({
        data: {
          name: dto.name,
          background_image_url: backgroundImageUrl,
          background_image_public_id: backgroundImagePublicId,
          back_image_url: backImageUrl,
          back_image_public_id: backImagePublicId,
          student_name_position: JSON.parse(dto.student_name_position),
          qr_position: JSON.parse(dto.qr_position),
          qr_size: dto.qr_size ? parseInt(dto.qr_size, 10) : 300,
          font_family: dto.font_family,
          font_sizes: JSON.parse(dto.font_sizes),
        },
      });

      if (dto.owner_type === 'module') {
        await tx.module.update({
          where: { id: dto.owner_id },
          data: { certificate_template_id: template.id },
        });
      } else if (dto.owner_type === 'course_certificado') {
        await tx.course.update({
          where: { id: dto.owner_id },
          data: { certificate_template_id: template.id },
        });
      } else {
        await tx.course.update({
          where: { id: dto.owner_id },
          data: { constancia_template_id: template.id },
        });
      }

      return template;
    });
  }
}

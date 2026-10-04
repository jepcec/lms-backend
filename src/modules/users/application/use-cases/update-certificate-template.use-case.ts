import {
  BadRequestException,
  Logger,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { UpdateCertificateTemplateDto } from '../dtos/update-certificate-template.dto';
import { type CertificateTemplateOwnerType } from './certificate-template-key.util';

const logger = new Logger('UpdateCertificateTemplateUseCase');

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

    let owner: { type: CertificateTemplateOwnerType; id: string } | null = null;
    if (template.courses[0]) {
      owner = { type: 'course_certificado', id: template.courses[0].id };
    } else if (template.constancia_courses[0]) {
      owner = {
        type: 'course_constancia',
        id: template.constancia_courses[0].id,
      };
    } else if (template.modules[0]) {
      owner = { type: 'module', id: template.modules[0].id };
    }

    // Una Constancia es de un solo lado: no lleva contraportada ni QR de
    // verificación (regla de negocio — ver CertificatePdfService).
    if (owner?.type === 'course_constancia' && dto.back_image) {
      throw new BadRequestException(
        'Las plantillas de Constancia no llevan contraportada',
      );
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

    const uploadedIds: string[] = [];
    const previousIds: string[] = [];
    try {
      if (dto.background_image) {
        const result = await this.fileStorageService.upload({
          buffer: dto.background_image.buffer,
          originalName: dto.background_image.originalname,
          mimetype: dto.background_image.mimetype,
          folder: 'certificate-templates',
        });
        uploadedIds.push(result.publicId);
        if (template.background_image_public_id)
          previousIds.push(template.background_image_public_id);
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
          folder: 'certificate-templates',
        });
        uploadedIds.push(result.publicId);
        if (template.back_image_public_id)
          previousIds.push(template.back_image_public_id);
        updateData.back_image_url = this.fileStorageService.getUrl(
          result.publicId,
          { format: 'png' },
        );
        updateData.back_image_public_id = result.publicId;
      }

      const saved = await this.prisma.certificateTemplate.update({
        where: { id },
        data: updateData,
      });
      for (const oldId of previousIds) {
        try {
          await this.fileStorageService.delete(oldId);
        } catch (error) {
          logger.error(`No se pudo retirar la imagen anterior ${oldId}`, error);
        }
      }
      return saved;
    } catch (error) {
      for (const newId of uploadedIds) {
        try {
          await this.fileStorageService.delete(newId);
        } catch (cleanupError) {
          logger.error(
            `No se pudo limpiar la nueva imagen ${newId}`,
            cleanupError,
          );
        }
      }
      throw error;
    }
  }
}

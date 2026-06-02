import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class UploadSliderImageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(sliderId: string, file: Express.Multer.File) {
    const slider = await this.prisma.slider.findUnique({
      where: { id: sliderId },
    });

    if (!slider) {
      throw new NotFoundException('Slider no encontrado');
    }

    if (slider.image_public_id) {
      await this.fileStorageService.delete(slider.image_public_id);
    }

    const result = await this.fileStorageService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: 'sliders',
    });

    const imageUrl = this.fileStorageService.getUrl(result.publicId, {
      format: 'webp',
    });

    await this.prisma.slider.update({
      where: { id: sliderId },
      data: {
        image_url: imageUrl,
        image_public_id: result.publicId,
      },
    });

    return {
      success: true,
      image_url: imageUrl,
    };
  }
}
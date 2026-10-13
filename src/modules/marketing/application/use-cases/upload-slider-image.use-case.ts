import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { replaceStoredImage } from '../../../storage/domain/replace-stored-image';

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
    if (!slider) throw new NotFoundException('Slider no encontrado');

    const imageUrl = await replaceStoredImage(
      this.fileStorageService,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: 'sliders',
      },
      slider.image_public_id,
      async (url, publicId) => {
        await this.prisma.slider.update({
          where: { id: sliderId },
          data: { image_url: url, image_public_id: publicId },
        });
        return url;
      },
      { format: 'webp' },
    );
    return { success: true, image_url: imageUrl };
  }
}

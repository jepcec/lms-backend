import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { replaceStoredImage } from '../../../storage/domain/replace-stored-image';

@Injectable()
export class UploadThumbnailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(courseId: string, file: Express.Multer.File) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const thumbnailUrl = await replaceStoredImage(
      this.fileStorageService,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimetype: file.mimetype,
        folder: 'courses',
      },
      course.thumbnail_public_id,
      async (url, publicId) => {
        await this.prisma.course.update({
          where: { id: courseId },
          data: { thumbnail_url: url, thumbnail_public_id: publicId },
        });
        return url;
      },
      { format: 'webp' },
    );
    return { success: true, thumbnail_url: thumbnailUrl };
  }
}

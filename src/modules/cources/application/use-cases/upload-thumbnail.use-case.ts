import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

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

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (course.thumbnail_public_id) {
      await this.fileStorageService.delete(course.thumbnail_public_id);
    }

    const result = await this.fileStorageService.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: 'courses',
    });

    const thumbnailUrl = this.fileStorageService.getUrl(result.publicId, {
      format: 'webp',
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        thumbnail_url: thumbnailUrl,
        thumbnail_public_id: result.publicId,
      },
    });

    return {
      success: true,
      thumbnail_url: thumbnailUrl,
    };
  }
}
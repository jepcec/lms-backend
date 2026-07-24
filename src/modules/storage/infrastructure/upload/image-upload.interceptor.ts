import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { FileFilterCallback } from 'multer';

export const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(
      new Error('Only image files are allowed (jpg, jpeg, png, webp)'),
    );
  }
  callback(null, true);
};

export const imageUploadInterceptor = (fieldName: string, maxMB = 5) =>
  FileInterceptor(fieldName, {
    storage: memoryStorage(),
    fileFilter: imageFileFilter,
    limits: { fileSize: maxMB * 1024 * 1024 },
  });

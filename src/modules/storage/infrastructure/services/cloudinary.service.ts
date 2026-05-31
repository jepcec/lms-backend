import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { IFileStorageService } from '../../domain/file-storage.interface';
import {
  ImageTransformOptions,
  UploadFileOptions,
  UploadFileResult,
} from '../../domain/file-storage.types';

@Injectable()
export class CloudinaryService implements IFileStorageService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: UploadFileOptions): Promise<UploadFileResult> {
    try {
      const folder = file.folder ? `lms/${file.folder}` : 'lms';
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder,
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
          resource_type: 'auto',
        },
      );

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        mimetype: result.resource_type,
        originalName: file.originalName,
        size: result.bytes,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al subir archivo a Cloudinary',
      );
    }
  }

  getUrl(publicId: string, options?: ImageTransformOptions): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al eliminar archivo de Cloudinary',
      );
    }
  }
}

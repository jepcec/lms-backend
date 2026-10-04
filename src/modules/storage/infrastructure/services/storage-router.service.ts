import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { IFileStorageService } from '../../domain/file-storage.interface';
import {
  ImageTransformOptions,
  UploadFileOptions,
  UploadFileResult,
} from '../../domain/file-storage.types';

@Injectable()
export class StorageRouterService implements IFileStorageService {
  constructor(
    private readonly active: IFileStorageService,
    private readonly local: IFileStorageService,
    private readonly cloudinary?: IFileStorageService,
    private readonly s3?: IFileStorageService,
  ) {}

  upload(file: UploadFileOptions): Promise<UploadFileResult> {
    return this.active.upload(file);
  }

  getUrl(publicId: string, options?: ImageTransformOptions): string {
    return this.providerFor(publicId).getUrl(publicId, options);
  }

  async delete(publicId: string): Promise<void> {
    await this.providerFor(publicId).delete(publicId);
  }

  private providerFor(publicId: string): IFileStorageService {
    if (publicId.startsWith('s3:')) {
      if (!this.s3)
        throw new ServiceUnavailableException('Configuración S3 no disponible');
      return this.s3;
    }
    if (publicId.startsWith('lms/')) {
      if (!this.cloudinary)
        throw new ServiceUnavailableException(
          'Configuración Cloudinary no disponible',
        );
      return this.cloudinary;
    }
    return this.local;
  }
}

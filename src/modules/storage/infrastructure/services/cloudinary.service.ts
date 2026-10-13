import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { lookup, promises as dns } from 'dns';
import { Agent } from 'https';
import { IFileStorageService } from '../../domain/file-storage.interface';
import {
  ImageTransformOptions,
  UploadFileOptions,
  UploadFileResult,
} from '../../domain/file-storage.types';

@Injectable()
export class CloudinaryService implements IFileStorageService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly uploadAgent = new Agent({
    lookup: (hostname, options, callback) => {
      // c-ares evita la demora observada en getaddrinfo; conservar
      // el resolvedor del sistema como alternativa.
      dns
        .resolve4(hostname)
        .then((addresses) => {
          if (addresses.length === 0) {
            lookup(hostname, options, callback);
            return;
          }
          if (options.all) {
            callback(
              null,
              addresses.map((address) => ({ address, family: 4 })),
            );
          } else {
            callback(null, addresses[0], 4);
          }
        })
        .catch(() => lookup(hostname, options, callback));
    },
  });

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: UploadFileOptions): Promise<UploadFileResult> {
    try {
      const publicId = file.key
        ? `lms/${file.key}`
        : `${file.folder ? `lms/${file.folder}` : 'lms'}/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          public_id: publicId,
          overwrite: !!file.key,
          invalidate: !!file.key,
          resource_type: 'auto',
          agent: this.uploadAgent,
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
    } catch (error: unknown) {
      const failure = this.failure(error);
      this.logger.error(`Fallo al subir a Cloudinary: ${failure.message}`);
      if (failure.httpCode === 499 || failure.name === 'TimeoutError') {
        throw new ServiceUnavailableException(
          'Cloudinary no respondió a tiempo',
        );
      }
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
      await cloudinary.uploader.destroy(publicId, {
        agent: this.uploadAgent,
      } as unknown as { invalidate?: boolean });
    } catch (error: unknown) {
      const failure = this.failure(error);
      this.logger.error(`Fallo al borrar en Cloudinary: ${failure.message}`);
      if (failure.httpCode === 499 || failure.name === 'TimeoutError') {
        throw new ServiceUnavailableException(
          'Cloudinary no respondió a tiempo',
        );
      }
      throw new InternalServerErrorException(
        'Error al eliminar archivo de Cloudinary',
      );
    }
  }

  private failure(error: unknown): {
    message: string;
    httpCode?: number;
    name?: string;
  } {
    const wrapped = error as {
      error?: { message?: string; http_code?: number; name?: string };
      message?: string;
      http_code?: number;
      name?: string;
    };
    const cause = wrapped?.error ?? wrapped;
    return {
      message: cause?.message ?? 'Error desconocido',
      httpCode: cause?.http_code,
      name: cause?.name,
    };
  }
}

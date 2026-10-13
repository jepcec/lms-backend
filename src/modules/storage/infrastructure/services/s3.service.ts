import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { IFileStorageService } from '../../domain/file-storage.interface';
import {
  UploadFileOptions,
  UploadFileResult,
} from '../../domain/file-storage.types';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class S3StorageService implements IFileStorageService {
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly client: S3Client;

  constructor(config: ConfigService, client?: S3Client) {
    const bucket = config.get<string>('S3_BUCKET')?.trim();
    const region = config.get<string>('S3_REGION')?.trim();
    if (!bucket || !region) {
      throw new Error('S3_BUCKET y S3_REGION son requeridos');
    }
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
      throw new Error('S3_BUCKET debe ser compatible con URL HTTPS de S3');
    }
    if (!/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(region)) {
      throw new Error('S3_REGION inválida');
    }
    this.bucket = bucket;
    this.publicBaseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
    this.client = client ?? new S3Client({ region });
  }

  async upload(file: UploadFileOptions): Promise<UploadFileResult> {
    const extension = EXTENSIONS[file.mimetype];
    if (!extension || !file.buffer.length) {
      throw new BadRequestException('Imagen inválida');
    }
    const prefix = file.key ?? file.folder ?? 'misc';
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
      throw new BadRequestException('Ruta de imagen inválida');
    }
    // Incluso con una key lógica fija, cada versión recibe una clave distinta.
    const key = `public/${prefix}/${randomUUID()}${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const publicId = `s3:${key}`;
    const url = this.getUrl(publicId);
    return {
      url,
      secureUrl: url,
      publicId,
      mimetype: file.mimetype,
      originalName: file.originalName,
      size: file.buffer.length,
    };
  }

  getUrl(publicId: string): string {
    const key = this.keyFromPublicId(publicId);
    return `${this.publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async delete(publicId: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.keyFromPublicId(publicId),
      }),
    );
  }

  private keyFromPublicId(publicId: string): string {
    if (!publicId.startsWith('s3:')) {
      throw new BadRequestException('Identificador S3 inválido');
    }
    const key = publicId.slice(3);
    if (
      !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(key) ||
      key.includes('..')
    ) {
      throw new BadRequestException('Identificador S3 inválido');
    }
    return key;
  }
}

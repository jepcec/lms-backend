import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I_FILE_STORAGE_SERVICE } from './domain/file-storage.interface';
import { LocalStorageService } from './infrastructure/services/local.service';
import { CloudinaryService } from './infrastructure/services/cloudinary.service';
import { S3StorageService } from './infrastructure/services/s3.service';
import { StorageRouterService } from './infrastructure/services/storage-router.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: I_FILE_STORAGE_SERVICE,
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('STORAGE_DRIVER') || 'local';
        if (!['local', 'cloudinary', 's3'].includes(driver)) {
          throw new Error(`STORAGE_DRIVER no admitido: ${driver}`);
        }
        const local = new LocalStorageService();
        const hasCloudinary = [
          'CLOUDINARY_CLOUD_NAME',
          'CLOUDINARY_API_KEY',
          'CLOUDINARY_API_SECRET',
        ].every((name) => !!config.get<string>(name)?.trim());
        if (driver === 'cloudinary' && !hasCloudinary) {
          throw new Error('Configuración Cloudinary incompleta');
        }
        const cloudinary = hasCloudinary
          ? new CloudinaryService(config)
          : undefined;
        const hasS3 = ['S3_BUCKET', 'S3_REGION'].some(
          (name) => !!config.get<string>(name)?.trim(),
        );
        const s3 =
          driver === 's3' || hasS3 ? new S3StorageService(config) : undefined;
        const active =
          driver === 's3' ? s3! : driver === 'cloudinary' ? cloudinary! : local;
        return new StorageRouterService(active, local, cloudinary, s3);
      },
      inject: [ConfigService],
    },
  ],
  exports: [I_FILE_STORAGE_SERVICE],
})
export class StorageModule {}

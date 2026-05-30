import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I_FILE_STORAGE_SERVICE } from './domain/file-storage.interface';
import { LocalStorageService } from './infrastructure/services/local.service';
import { CloudinaryService } from './infrastructure/services/cloudinary.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: I_FILE_STORAGE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const driver = configService.get<string>('STORAGE_DRIVER');
        if (driver === 'cloudinary') {
          return new CloudinaryService(configService);
        }
        return new LocalStorageService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [I_FILE_STORAGE_SERVICE],
})
export class StorageModule {}

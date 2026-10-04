import { ConfigService } from '@nestjs/config';
import { I_FILE_STORAGE_SERVICE } from './domain/file-storage.interface';
import { StorageModule } from './storage.module';

describe('StorageModule', () => {
  const provider = (
    Reflect.getMetadata('providers', StorageModule) as Array<{
      provide: symbol;
      useFactory: (config: ConfigService) => { getUrl: (id: string) => string };
    }>
  ).find((item) => item.provide === I_FILE_STORAGE_SERVICE)!;

  it('selecciona S3 y conserva las URLs locales anteriores', () => {
    const storage = provider.useFactory(
      new ConfigService({
        STORAGE_DRIVER: 's3',
        S3_BUCKET: 'especializaciones-global',
        S3_REGION: 'us-east-1',
      }),
    );
    expect(storage.getUrl('s3:public/courses/new.png')).toBe(
      'https://especializaciones-global.s3.us-east-1.amazonaws.com/public/courses/new.png',
    );
    expect(storage.getUrl('courses/old.png')).toBe('/uploads/courses/old.png');
  });

  it('rechaza un driver desconocido o S3 sin configuración', () => {
    expect(() =>
      provider.useFactory(new ConfigService({ STORAGE_DRIVER: 'other' })),
    ).toThrow();
    expect(() =>
      provider.useFactory(new ConfigService({ STORAGE_DRIVER: 's3' })),
    ).toThrow();
  });
});

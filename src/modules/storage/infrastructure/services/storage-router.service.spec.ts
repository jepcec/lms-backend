import { ServiceUnavailableException } from '@nestjs/common';
import type { IFileStorageService } from '../../domain/file-storage.interface';
import { StorageRouterService } from './storage-router.service';

describe('StorageRouterService', () => {
  const provider = (url: string) =>
    ({
      upload: jest.fn(),
      getUrl: jest.fn(() => url),
      delete: jest.fn().mockResolvedValue(undefined),
    }) as unknown as jest.Mocked<IFileStorageService>;

  it('conserva lectura y borrado de activos locales y Cloudinary tras activar S3', async () => {
    const local = provider('/uploads/courses/old.jpg');
    const cloudinary = provider('https://res.cloudinary.com/old.jpg');
    const s3 = provider('https://images.example.test/new.jpg');
    const router = new StorageRouterService(s3, local, cloudinary, s3);

    expect(router.getUrl('courses/old.jpg')).toBe('/uploads/courses/old.jpg');
    expect(router.getUrl('lms/courses/old')).toBe(
      'https://res.cloudinary.com/old.jpg',
    );
    expect(router.getUrl('s3:courses/new.jpg')).toBe(
      'https://images.example.test/new.jpg',
    );
    await router.delete('courses/old.jpg');
    await router.delete('lms/courses/old');
    await router.delete('s3:courses/new.jpg');
    expect(local.delete.mock.calls).toEqual([['courses/old.jpg']]);
    expect(cloudinary.delete.mock.calls).toEqual([['lms/courses/old']]);
    expect(s3.delete.mock.calls).toEqual([['s3:courses/new.jpg']]);
  });

  it('no dirige un borrado Cloudinary hacia el proveedor activo si faltan sus credenciales', async () => {
    const local = provider('/uploads/old.jpg');
    const s3 = provider('https://images.example.test/new.jpg');
    const router = new StorageRouterService(s3, local, undefined, s3);
    await expect(router.delete('lms/old')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(s3.delete.mock.calls).toHaveLength(0);
  });
});

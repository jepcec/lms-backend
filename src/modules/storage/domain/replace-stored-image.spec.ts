import { Logger } from '@nestjs/common';
import type { IFileStorageService } from './file-storage.interface';
import { replaceStoredImage } from './replace-stored-image';

describe('replaceStoredImage', () => {
  const file = {
    buffer: Buffer.from('bytes'),
    originalName: 'photo.png',
    mimetype: 'image/png',
  };
  const storage = {
    upload: jest.fn().mockResolvedValue({ publicId: 's3:new/photo.png' }),
    getUrl: jest
      .fn()
      .mockReturnValue('https://images.example.test/new/photo.png'),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IFileStorageService>;
  const persist = jest.fn().mockResolvedValue('saved');

  beforeEach(() => {
    jest.clearAllMocks();
    storage.upload.mockResolvedValue({ publicId: 's3:new/photo.png' } as never);
    storage.delete.mockResolvedValue(undefined);
    persist.mockResolvedValue('saved');
  });

  it('sube, guarda la nueva referencia y luego borra la imagen anterior', async () => {
    const order: string[] = [];
    storage.upload.mockImplementation(() => {
      order.push('upload');
      return Promise.resolve({ publicId: 's3:new/photo.png' } as never);
    });
    persist.mockImplementation(() => {
      order.push('persist');
      return Promise.resolve('saved');
    });
    storage.delete.mockImplementation(() => {
      order.push('delete');
      return Promise.resolve();
    });
    await expect(
      replaceStoredImage(storage, file, 'lms/old', persist),
    ).resolves.toBe('saved');
    expect(order).toEqual(['upload', 'persist', 'delete']);
    expect(storage.delete.mock.calls).toEqual([['lms/old']]);
    expect(persist).toHaveBeenCalledWith(
      'https://images.example.test/new/photo.png',
      's3:new/photo.png',
    );
  });

  it('conserva la imagen anterior cuando falla la subida', async () => {
    storage.upload.mockRejectedValueOnce(new Error('S3 unavailable'));
    await expect(
      replaceStoredImage(storage, file, 'lms/old', persist),
    ).rejects.toThrow('S3 unavailable');
    expect(persist).not.toHaveBeenCalled();
    expect(storage.delete.mock.calls).toHaveLength(0);
  });

  it('limpia la imagen nueva y conserva la anterior cuando falla la base de datos', async () => {
    persist.mockRejectedValueOnce(new Error('DB unavailable'));
    await expect(
      replaceStoredImage(storage, file, 'lms/old', persist),
    ).rejects.toThrow('DB unavailable');
    expect(storage.delete.mock.calls).toHaveLength(1);
    expect(storage.delete.mock.calls).toEqual([['s3:new/photo.png']]);
  });

  it('no pierde el resultado guardado si falla retirar la imagen anterior', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    storage.delete.mockRejectedValueOnce(new Error('legacy unavailable'));
    await expect(
      replaceStoredImage(storage, file, 'lms/old', persist),
    ).resolves.toBe('saved');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

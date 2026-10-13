import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Agent } from 'https';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload: jest.fn(), destroy: jest.fn() },
    url: jest.fn(),
  },
}));

describe('CloudinaryService', () => {
  const uploader = cloudinary.uploader as unknown as {
    upload: jest.Mock;
    destroy: jest.Mock;
  };
  const service = new CloudinaryService(
    new ConfigService({
      CLOUDINARY_CLOUD_NAME: 'test',
      CLOUDINARY_API_KEY: 'test',
      CLOUDINARY_API_SECRET: 'test',
    }),
  );
  const file = {
    buffer: Buffer.from('bytes'),
    originalName: 'slider.png',
    mimetype: 'image/png',
    folder: 'sliders',
  };

  beforeEach(() => jest.clearAllMocks());

  it('sube y borra usando el agente con resolución DNS directa', async () => {
    uploader.upload.mockResolvedValue({
      url: 'http://example.test/slider.png',
      secure_url: 'https://example.test/slider.png',
      public_id: 'lms/sliders/1',
      resource_type: 'image',
      bytes: 5,
    });
    uploader.destroy.mockResolvedValue({ result: 'ok' });
    const result = await service.upload(file);
    expect(result.publicId).toBe('lms/sliders/1');
    const uploadCalls = uploader.upload.mock.calls as Array<
      [string, { agent: Agent }]
    >;
    expect(uploadCalls[0][1].agent).toBeInstanceOf(Agent);
    await service.delete(result.publicId);
    const deleteCalls = uploader.destroy.mock.calls as Array<
      [string, { agent: Agent }]
    >;
    expect(deleteCalls[0][1].agent).toBe(uploadCalls[0][1].agent);
  });

  it('registra el timeout real y devuelve 503', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    uploader.upload.mockRejectedValue({
      error: {
        message: 'Request Timeout',
        http_code: 499,
        name: 'TimeoutError',
      },
    });
    await expect(service.upload(file)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(log).toHaveBeenCalledWith(
      'Fallo al subir a Cloudinary: Request Timeout',
    );
    log.mockRestore();
  });
});

import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3StorageService } from './s3.service';

describe('S3StorageService', () => {
  const commands: Array<PutObjectCommand | DeleteObjectCommand> = [];
  const send = jest.fn((command: PutObjectCommand | DeleteObjectCommand) => {
    commands.push(command);
    return Promise.resolve({});
  });
  const config = new ConfigService({
    S3_BUCKET: 'especializaciones-global',
    S3_REGION: 'us-east-1',
  });
  const service = new S3StorageService(config, { send } as unknown as S3Client);
  const image = {
    buffer: Buffer.from('image bytes'),
    originalName: 'photo.png',
    mimetype: 'image/png',
    folder: 'courses',
  };

  beforeEach(() => {
    send.mockClear();
    commands.length = 0;
  });

  it('sube bytes bajo public/ y devuelve la URL directa de S3', async () => {
    const result = await service.upload(image);
    const command = commands[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'especializaciones-global',
      Key: result.publicId.slice(3),
      Body: image.buffer,
      ContentType: 'image/png',
    });
    expect(result.publicId).toMatch(/^s3:public\/courses\/[0-9a-f-]+\.png$/);
    expect(result.url).toBe(
      `https://especializaciones-global.s3.us-east-1.amazonaws.com/${result.publicId.slice(3)}`,
    );
    expect(result.secureUrl).toBe(result.url);
    expect(result.url).not.toContain('X-Amz-');
  });

  it('genera la URL HTTPS directa y valida bucket y región', () => {
    expect(service.getUrl('s3:public/courses/photo.png')).toBe(
      'https://especializaciones-global.s3.us-east-1.amazonaws.com/public/courses/photo.png',
    );
    expect(
      () => new S3StorageService(new ConfigService({ S3_BUCKET: 'bucket' })),
    ).toThrow();
    expect(
      () =>
        new S3StorageService(
          new ConfigService({
            S3_BUCKET: 'bucket.with.dots',
            S3_REGION: 'us-east-1',
          }),
        ),
    ).toThrow();
  });

  it('genera una clave distinta al reemplazar y borra solo la versión anterior', async () => {
    const first = await service.upload({
      ...image,
      key: 'certificate-templates/course/1/front',
    });
    const second = await service.upload({
      ...image,
      key: 'certificate-templates/course/1/front',
    });
    expect(first.publicId).not.toBe(second.publicId);
    expect(first.url).not.toBe(second.url);
    await service.delete(first.publicId);
    const deletion = commands[2];
    expect(deletion).toBeInstanceOf(DeleteObjectCommand);
    expect(deletion.input).toEqual({
      Bucket: 'especializaciones-global',
      Key: first.publicId.slice(3),
    });
  });

  it('rechaza identificadores ajenos y no envía comandos', async () => {
    await expect(service.delete('lms/courses/photo')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.upload({ ...image, folder: '../outside' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(send).not.toHaveBeenCalled();
  });
});

import { Logger } from '@nestjs/common';
import type { IFileStorageService } from './file-storage.interface';
import type {
  ImageTransformOptions,
  UploadFileOptions,
} from './file-storage.types';

const logger = new Logger('ReplaceStoredImage');

/** Publica la nueva referencia antes de retirar la versión anterior. */
export async function replaceStoredImage<T>(
  storage: IFileStorageService,
  file: UploadFileOptions,
  previousPublicId: string | null | undefined,
  persist: (url: string, publicId: string) => Promise<T>,
  options?: ImageTransformOptions,
): Promise<T> {
  const uploaded = await storage.upload(file);
  let saved: T;
  try {
    saved = await persist(
      storage.getUrl(uploaded.publicId, options),
      uploaded.publicId,
    );
  } catch (error) {
    try {
      await storage.delete(uploaded.publicId);
    } catch (cleanupError) {
      logger.error(
        `No se pudo limpiar la nueva imagen ${uploaded.publicId}`,
        cleanupError,
      );
    }
    throw error;
  }
  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    try {
      await storage.delete(previousPublicId);
    } catch (cleanupError) {
      logger.error(
        `No se pudo retirar la imagen anterior ${previousPublicId}`,
        cleanupError,
      );
    }
  }
  return saved;
}

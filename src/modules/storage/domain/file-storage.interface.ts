import {
  ImageTransformOptions,
  UploadFileOptions,
  UploadFileResult,
} from './file-storage.types';

export interface IFileStorageService {
  upload(file: UploadFileOptions): Promise<UploadFileResult>;
  delete(publicId: string): Promise<void>;
  getUrl(publicId: string, options?: ImageTransformOptions): string;
}

export const I_FILE_STORAGE_SERVICE = Symbol('IFileStorageService');

export interface UploadFileOptions {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  folder?: string;
}

export interface UploadFileResult {
  url: string;
  secureUrl: string;
  publicId: string;
  mimetype: string;
  originalName: string;
  size: number;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?:
    'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

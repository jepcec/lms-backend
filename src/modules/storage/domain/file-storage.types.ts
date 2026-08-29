export interface UploadFileOptions {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  folder?: string;
  /**
   * Ruta/nombre exacto a usar (sin sufijo aleatorio). Si se informa, subidas
   * sucesivas con la misma key sobrescriben el archivo anterior en vez de
   * generar uno nuevo — usado para assets con dueño único (ej. plantillas
   * de certificado), donde el path ya identifica de forma determinística
   * a quién pertenece el archivo.
   */
  key?: string;
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
    | 'auto'
    | 'auto:best'
    | 'auto:good'
    | 'auto:eco'
    | 'auto:low'
    | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

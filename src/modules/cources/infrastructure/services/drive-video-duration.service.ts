import { Injectable, Logger } from '@nestjs/common';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Duración de un video de Drive vía Drive API v3 (videoMediaMetadata). Requiere
 * una clave de Google con la Drive API habilitada (GOOGLE_API_KEY, o la misma
 * YOUTUBE_API_KEY si su proyecto la tiene activa) y que el archivo sea público.
 * Si no se puede obtener devuelve null y la duración se ingresa a mano.
 */
@Injectable()
export class DriveVideoDurationService {
  private readonly logger = new Logger(DriveVideoDurationService.name);

  async getDurationMinutes(fileId: string): Promise<number | null> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY;
    if (!apiKey || !fileId) return null;

    try {
      const url =
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
        `?fields=videoMediaMetadata(durationMillis)&supportsAllDrives=true&key=${apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) {
        this.logger.warn(`Drive API respondió ${response.status} para el archivo ${fileId}`);
        return null;
      }

      const data = (await response.json()) as {
        videoMediaMetadata?: { durationMillis?: string };
      };
      const millis = Number(data.videoMediaMetadata?.durationMillis);
      if (!Number.isFinite(millis) || millis <= 0) return null;

      return Math.max(1, Math.round(millis / 60000));
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener la duración del video ${fileId} desde Drive: ${(error as Error).message}`,
      );
      return null;
    }
  }
}

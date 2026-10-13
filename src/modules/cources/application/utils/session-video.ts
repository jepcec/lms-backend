import { BadRequestException } from '@nestjs/common';
import type { VideoProvider } from '../../domain/session.entity';
import { parseGoogleDriveLink } from '../../infrastructure/services/google-drive-link';
import type { YoutubeDurationService } from '../../infrastructure/services/youtube-duration.service';
import type { DriveVideoDurationService } from '../../infrastructure/services/drive-video-duration.service';

export interface SessionVideoInput {
  video_provider?: VideoProvider;
  youtube_url?: string | null;
  /** Si viene explícito tiene prioridad sobre el extraído de youtube_url. */
  youtube_video_id?: string | null;
  drive_url?: string | null;
}

export interface SessionVideo {
  video_provider: VideoProvider;
  youtube_url: string | null;
  youtube_video_id: string | null;
  drive_url: string | null;
  /** ID del video en su proveedor; sirve para detectar si el video cambió. */
  video_id: string;
}

export function extractYoutubeId(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] ?? '';
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery) return fromQuery;
    return parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? '';
  } catch {
    return '';
  }
}

/**
 * Valida el video de una sesión según su fuente y deja en null los campos de
 * la otra fuente (la base exige que cada sesión tenga el video de su fuente).
 */
export function resolveSessionVideo(input: SessionVideoInput): SessionVideo {
  const provider = input.video_provider ?? 'youtube';

  if (provider === 'drive') {
    const link = input.drive_url ? parseGoogleDriveLink(input.drive_url) : null;
    if (!link || link.kind !== 'file') {
      throw new BadRequestException(
        'El enlace de Drive debe ser de un archivo de video (no de una carpeta ni de un documento).',
      );
    }
    return {
      video_provider: 'drive',
      youtube_url: null,
      youtube_video_id: null,
      drive_url: `https://drive.google.com/file/d/${link.id}/view`,
      video_id: link.id,
    };
  }

  const youtubeUrl = input.youtube_url?.trim() ?? '';
  const youtubeId = youtubeUrl
    ? input.youtube_video_id?.trim() || extractYoutubeId(youtubeUrl)
    : '';
  if (!youtubeId) {
    throw new BadRequestException('La URL de YouTube no es válida.');
  }
  return {
    video_provider: 'youtube',
    youtube_url: youtubeUrl,
    youtube_video_id: youtubeId,
    drive_url: null,
    video_id: youtubeId,
  };
}

export async function detectVideoDuration(
  video: SessionVideo,
  services: { youtube: YoutubeDurationService; drive: DriveVideoDurationService },
): Promise<number | null> {
  return video.video_provider === 'drive'
    ? services.drive.getDurationMinutes(video.video_id)
    : services.youtube.getDurationMinutes(video.video_id);
}

export function missingDurationMessage(provider: VideoProvider): string {
  return provider === 'drive'
    ? 'No se pudo detectar la duración desde Drive. Ingresa la duración manualmente.'
    : 'No se pudo detectar la duración desde YouTube. Ingresa la duración manualmente.';
}

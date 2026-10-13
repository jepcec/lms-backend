import type { VideoProvider } from '../../domain/session.entity';

export class CreateSessionDto {
  module_id: string;
  title: string;
  description?: string;
  /** Por defecto 'youtube'. */
  video_provider?: VideoProvider;
  /** Requerido si video_provider = 'youtube'. */
  youtube_url?: string;
  youtube_video_id?: string;
  /** Requerido si video_provider = 'drive'. */
  drive_url?: string;
  duration_minutes?: number;
  display_order?: number;
}

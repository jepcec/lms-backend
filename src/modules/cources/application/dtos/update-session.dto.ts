import type { VideoProvider } from '../../domain/session.entity';

export class UpdateSessionDto {
  title?: string;
  description?: string | null;
  video_provider?: VideoProvider;
  youtube_url?: string;
  youtube_video_id?: string;
  drive_url?: string;
  duration_minutes?: number;
  display_order?: number;
}

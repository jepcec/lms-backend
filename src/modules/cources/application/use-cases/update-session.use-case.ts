import { Injectable, Inject } from '@nestjs/common';
import { I_SESSION_REPOSITORY } from '../../domain/sessions.repository';
import type { ISessionRepository } from '../../domain/sessions.repository';
import { UpdateSessionDto } from '../dtos/update-session.dto';
import { SessionEntity } from '../../domain/session.entity';
import { YoutubeDurationService } from '../../infrastructure/services/youtube-duration.service';
import { DriveVideoDurationService } from '../../infrastructure/services/drive-video-duration.service';
import { detectVideoDuration, resolveSessionVideo } from '../utils/session-video';

@Injectable()
export class UpdateSessionUseCase {
  constructor(
    @Inject(I_SESSION_REPOSITORY)
    private readonly sessionRepository: ISessionRepository,
    private readonly youtubeDuration: YoutubeDurationService,
    private readonly driveDuration: DriveVideoDurationService,
  ) {}

  async execute(id: string, dto: UpdateSessionDto) {
    const existing = await this.sessionRepository.findById(id);
    if (!existing) throw new Error('Sesión no encontrada');

    const provider = dto.video_provider ?? existing.video_provider;
    const video = resolveSessionVideo({
      video_provider: provider,
      youtube_url: dto.youtube_url ?? existing.youtube_url,
      youtube_video_id: dto.youtube_video_id,
      drive_url: dto.drive_url ?? existing.drive_url,
    });

    // Solo se vuelve a consultar la duración si el video cambió.
    const previousVideoId =
      existing.video_provider === 'drive' ? existing.drive_url : existing.youtube_video_id;
    const videoChanged =
      video.video_provider !== existing.video_provider ||
      (video.video_provider === 'drive' ? video.drive_url : video.youtube_video_id) !==
        previousVideoId;

    let duration_minutes = dto.duration_minutes ?? existing.duration_minutes;
    if (videoChanged) {
      const autoDuration = await detectVideoDuration(video, {
        youtube: this.youtubeDuration,
        drive: this.driveDuration,
      });
      duration_minutes = autoDuration ?? duration_minutes;
    }

    const updated = new SessionEntity({
      id: existing.id,
      module_id: existing.module_id,
      title: dto.title ?? existing.title,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      video_provider: video.video_provider,
      youtube_url: video.youtube_url,
      youtube_video_id: video.youtube_video_id,
      drive_url: video.drive_url,
      duration_minutes,
      display_order: dto.display_order ?? existing.display_order,
      created_at: existing.created_at,
    });
    await this.sessionRepository.save(updated);
    return { success: true, message: 'Sesión actualizada' };
  }
}

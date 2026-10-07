import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { I_SESSION_REPOSITORY } from '../../domain/sessions.repository';
import type { ISessionRepository } from '../../domain/sessions.repository';
import { CreateSessionDto } from '../dtos/create-session.dto';
import { SessionEntity } from '../../domain/session.entity';
import { YoutubeDurationService } from '../../infrastructure/services/youtube-duration.service';
import { DriveVideoDurationService } from '../../infrastructure/services/drive-video-duration.service';
import {
  detectVideoDuration,
  missingDurationMessage,
  resolveSessionVideo,
} from '../utils/session-video';

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(I_SESSION_REPOSITORY)
    private readonly sessionRepository: ISessionRepository,
    private readonly youtubeDuration: YoutubeDurationService,
    private readonly driveDuration: DriveVideoDurationService,
  ) {}

  async execute(dto: CreateSessionDto) {
    let display_order = dto.display_order;
    if (display_order === undefined || display_order === null) {
      const existing = await this.sessionRepository.findByModuleId(
        dto.module_id,
      );
      display_order = existing.length + 1;
    }

    const video = resolveSessionVideo(dto);

    const autoDuration = await detectVideoDuration(video, {
      youtube: this.youtubeDuration,
      drive: this.driveDuration,
    });
    const duration_minutes = autoDuration ?? dto.duration_minutes;

    if (!duration_minutes) {
      throw new BadRequestException(missingDurationMessage(video.video_provider));
    }

    const session = new SessionEntity({
      id: crypto.randomUUID(),
      module_id: dto.module_id,
      title: dto.title,
      description: dto.description ?? null,
      video_provider: video.video_provider,
      youtube_url: video.youtube_url,
      youtube_video_id: video.youtube_video_id,
      drive_url: video.drive_url,
      duration_minutes,
      display_order,
      created_at: new Date(),
    });

    await this.sessionRepository.save(session);
    return {
      success: true,
      message: 'Sesión creada',
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        video_provider: session.video_provider,
        youtube_url: session.youtube_url,
        youtube_video_id: session.youtube_video_id,
        drive_url: session.drive_url,
        duration_minutes: session.duration_minutes,
        display_order: session.display_order,
        materials_count: 0,
      },
    };
  }
}

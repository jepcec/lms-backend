import { Injectable } from '@nestjs/common';
import { ISessionRepository } from '../../domain/sessions.repository';
import { PrismaService } from 'src/core/database/prisma.service';
import { SessionEntity } from '../../domain/session.entity';
import type { Session } from 'src/generated/prisma/client';
import { recalculateCourseDurationByModule } from './course-duration';

function toEntity(s: Session): SessionEntity {
  return new SessionEntity({
    id: s.id,
    module_id: s.module_id,
    title: s.title,
    description: s.description,
    video_provider: s.video_provider,
    youtube_url: s.youtube_url,
    youtube_video_id: s.youtube_video_id,
    drive_url: s.drive_url,
    duration_minutes: s.duration_minutes,
    display_order: s.display_order,
    created_at: s.created_at,
  });
}

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SessionEntity | null> {
    const session = await this.prisma.session.findUnique({ where: { id } });
    return session ? toEntity(session) : null;
  }

  async findByModuleId(moduleId: string): Promise<SessionEntity[]> {
    const sessions = await this.prisma.session.findMany({
      where: { module_id: moduleId },
      orderBy: { display_order: 'asc' },
    });
    return sessions.map(toEntity);
  }

  async save(session: SessionEntity): Promise<void> {
    const data = {
      title: session.title,
      description: session.description,
      video_provider: session.video_provider,
      youtube_url: session.youtube_url,
      youtube_video_id: session.youtube_video_id,
      drive_url: session.drive_url,
      duration_minutes: session.duration_minutes,
      display_order: session.display_order,
    };
    await this.prisma.session.upsert({
      where: { id: session.id },
      update: data,
      create: { id: session.id, module_id: session.module_id, ...data },
    });
    await recalculateCourseDurationByModule(this.prisma, session.module_id);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.prisma.session.delete({
      where: { id },
      select: { module_id: true },
    });
    await recalculateCourseDurationByModule(this.prisma, deleted.module_id);
  }
}

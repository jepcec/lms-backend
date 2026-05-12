import { Injectable } from "@nestjs/common";
import { ISessionRepository } from "../../domain/sessions.repository";
import { PrismaService } from "src/core/database/prisma.service";
import { SessionEntity } from "../../domain/session.entity";

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
	constructor(private readonly prisma: PrismaService) { }

	async findById(id: string): Promise<SessionEntity | null> {
		const session = await this.prisma.session.findUnique({ where: { id } })
		if (!session) return null
		return new SessionEntity({
			id: session.id,
			module_id: session.module_id,
			title: session.title,
			description: session.description,
			youtube_url: session.youtube_url,
			youtube_video_id: session.youtube_video_id,
			duration_minutes: session.duration_minutes,
			display_order: session.display_order,
			created_at: session.created_at,
		})
	}

	async findByModuleId(moduleId: string): Promise<SessionEntity[]> {
		const sessions = await this.prisma.session.findMany({
			where: { module_id: moduleId },
			orderBy: { display_order: 'asc' }
		})
		return sessions.map(s => new SessionEntity({
			id: s.id,
			module_id: s.module_id,
			title: s.title,
			description: s.description,
			youtube_url: s.youtube_url,
			youtube_video_id: s.youtube_video_id,
			duration_minutes: s.duration_minutes,
			display_order: s.display_order,
			created_at: s.created_at,
		}))
	}

	async save(session: SessionEntity): Promise<void> {
		await this.prisma.session.upsert({
			where: { id: session.id },
			update: {
				title: session.title,
				description: session.description,
				youtube_url: session.youtube_url,
				youtube_video_id: session.youtube_video_id,
				duration_minutes: session.duration_minutes,
				display_order: session.display_order,
			},
			create: {
				id: session.id,
				module_id: session.module_id,
				title: session.title,
				description: session.description,
				youtube_url: session.youtube_url,
				youtube_video_id: session.youtube_video_id,
				duration_minutes: session.duration_minutes,
				display_order: session.display_order,
			}
		})
	}

	async delete(id: string): Promise<void> {
		await this.prisma.session.delete({ where: { id } })
	}
}
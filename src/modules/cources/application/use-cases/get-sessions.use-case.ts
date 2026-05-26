import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class GetSessionsUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
		private readonly prisma: PrismaService,
	) { }

	async executeByModule(moduleId: string) {
		const sessions = await this.prisma.session.findMany({
			where: { module_id: moduleId },
			orderBy: { display_order: 'asc' },
			include: {
				materials: { select: { id: true } },
			},
		});
		return sessions.map(s => ({
			id: s.id,
			title: s.title,
			description: s.description,
			youtube_url: s.youtube_url,
			youtube_video_id: s.youtube_video_id,
			duration_minutes: s.duration_minutes,
			display_order: s.display_order,
			materials_count: s.materials.length,
		}));
	}

	async executeById(id: string) {
		const session = await this.sessionRepository.findById(id);
		if (!session) throw new Error("Sesión no encontrada");
		return {
			id: session.id,
			title: session.title,
			description: session.description,
			youtube_url: session.youtube_url,
			youtube_video_id: session.youtube_video_id,
			duration_minutes: session.duration_minutes,
			display_order: session.display_order,
		};
	}
}
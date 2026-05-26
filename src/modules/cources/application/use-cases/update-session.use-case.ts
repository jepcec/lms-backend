import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";
import { UpdateSessionDto } from "../dtos/update-session.dto";
import { SessionEntity } from "../../domain/session.entity";

function extractYoutubeId(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('?')[0];
		return parsed.searchParams.get('v') ?? '';
	} catch {
		return '';
	}
}

@Injectable()
export class UpdateSessionUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async execute(id: string, dto: UpdateSessionDto) {
		const existing = await this.sessionRepository.findById(id)
		if (!existing) throw new Error("Sesión no encontrada")

		const youtube_url = dto.youtube_url ?? existing.youtube_url;
		const updated = new SessionEntity({
			id: existing.id,
			module_id: existing.module_id,
			title: dto.title ?? existing.title,
			description: dto.description !== undefined ? dto.description : existing.description,
			youtube_url,
			youtube_video_id: dto.youtube_video_id ?? extractYoutubeId(youtube_url),
			duration_minutes: dto.duration_minutes ?? existing.duration_minutes,
			display_order: dto.display_order ?? existing.display_order,
			created_at: existing.created_at,
		})
		await this.sessionRepository.save(updated)
		return { success: true, message: "Sesión actualizada" }
	}
}
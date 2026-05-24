import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";
import { CreateSessionDto } from "../dtos/create-session.dto";
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
export class CreateSessionUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async execute(dto: CreateSessionDto) {
		let display_order = dto.display_order;
		if (display_order === undefined || display_order === null) {
			const existing = await this.sessionRepository.findByModuleId(dto.module_id);
			display_order = existing.length + 1;
		}

		const session = new SessionEntity({
			id: crypto.randomUUID(),
			module_id: dto.module_id,
			title: dto.title,
			description: dto.description ?? null,
			youtube_url: dto.youtube_url,
			youtube_video_id: dto.youtube_video_id ?? extractYoutubeId(dto.youtube_url),
			duration_minutes: dto.duration_minutes,
			display_order,
			created_at: new Date(),
		})

		await this.sessionRepository.save(session)
		return {
			success: true,
			message: "Sesión creada",
			session: {
				id: session.id,
				title: session.title,
				description: session.description,
				youtube_url: session.youtube_url,
				youtube_video_id: session.youtube_video_id,
				duration_minutes: session.duration_minutes,
				display_order: session.display_order,
				materials_count: 0,
			},
		}
	}
}
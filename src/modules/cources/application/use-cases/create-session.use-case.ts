import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";
import { CreateSessionDto } from "../dtos/create-session.dto";
import { SessionEntity } from "../../domain/session.entity";

@Injectable()
export class CreateSessionUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async execute(dto: CreateSessionDto) {
		const session = new SessionEntity({
			id: crypto.randomUUID(),
			module_id: dto.module_id,
			title: dto.title,
			description: dto.description ?? null,
			youtube_url: dto.youtube_url,
			youtube_video_id: dto.youtube_video_id,
			duration_minutes: dto.duration_minutes,
			display_order: dto.display_order,
			created_at: new Date(),
		})

		await this.sessionRepository.save(session)
		return { success: true, message: "Sesión creada", session }
	}
}
import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";

@Injectable()
export class GetSessionsUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async executeByModule(moduleId: string) {
		return this.sessionRepository.findByModuleId(moduleId)
	}

	async executeById(id: string) {
		const session = await this.sessionRepository.findById(id)
		if (!session) throw new Error("Sesión no encontrada")
		return session
	}
}
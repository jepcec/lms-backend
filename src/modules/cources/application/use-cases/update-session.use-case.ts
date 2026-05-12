import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";
import { UpdateSessionDto } from "../dtos/update-session.dto";

@Injectable()
export class UpdateSessionUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async execute(id: string, dto: UpdateSessionDto) {
		const session = await this.sessionRepository.findById(id)
		if (!session) throw new Error("Sesión no encontrada")

		Object.assign(session, dto)
		await this.sessionRepository.save(session)
		return { success: true, message: "Sesión actualizada" }
	}
}
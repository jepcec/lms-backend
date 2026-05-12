import { Injectable, Inject } from "@nestjs/common";
import { I_SESSION_REPOSITORY } from "../../domain/sessions.repository";
import type { ISessionRepository } from "../../domain/sessions.repository";

@Injectable()
export class DeleteSessionUseCase {
	constructor(
		@Inject(I_SESSION_REPOSITORY)
		private readonly sessionRepository: ISessionRepository,
	) { }

	async execute(id: string) {
		const session = await this.sessionRepository.findById(id)
		if (!session) throw new Error("Sesión no encontrada")

		await this.sessionRepository.delete(id)
		return { success: true, message: "Sesión eliminada" }
	}
}
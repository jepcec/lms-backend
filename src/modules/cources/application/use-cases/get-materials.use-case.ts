import { Injectable, Inject } from "@nestjs/common";
import { I_MATERIAL_REPOSITORY } from "../../domain/materials.repository";
import type { IMaterialRepository } from "../../domain/materials.repository";

@Injectable()
export class GetMaterialsUseCase {
	constructor(
		@Inject(I_MATERIAL_REPOSITORY)
		private readonly materialRepository: IMaterialRepository,
	) { }

	async executeBySession(sessionId: string) {
		return this.materialRepository.findBySessionId(sessionId)
	}
}
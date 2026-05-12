import { Injectable, Inject } from "@nestjs/common";
import { I_MODULE_REPOSITORY } from "../../domain/modules.repository";
import type { IModuleRepository } from "../../domain/modules.repository";

@Injectable()
export class GetModulesUseCase {
	constructor(
		@Inject(I_MODULE_REPOSITORY)
		private readonly moduleRepository: IModuleRepository,
	) { }

	async executeByCourse(courseId: string) {
		return this.moduleRepository.findByCourseId(courseId)
	}

	async executeById(id: string) {
		const module = await this.moduleRepository.findById(id)
		if (!module) throw new Error("Módulo no encontrado")
		return module
	}
}
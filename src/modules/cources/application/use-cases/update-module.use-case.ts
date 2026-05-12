import { Injectable, Inject } from "@nestjs/common";
import { I_MODULE_REPOSITORY } from "../../domain/modules.repository";
import type { IModuleRepository } from "../../domain/modules.repository";
import { UpdateModuleDto } from "../dtos/update-module.dto";

@Injectable()
export class UpdateModuleUseCase {
	constructor(
		@Inject(I_MODULE_REPOSITORY)
		private readonly moduleRepository: IModuleRepository,
	) { }

	async execute(id: string, dto: UpdateModuleDto) {
		const module = await this.moduleRepository.findById(id)
		if (!module) throw new Error("Módulo no encontrado")

		Object.assign(module, dto)
		await this.moduleRepository.save(module)
		return { success: true, message: "Módulo actualizado" }
	}
}
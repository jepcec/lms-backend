import { Injectable, Inject } from "@nestjs/common";
import { I_MODULE_REPOSITORY } from "../../domain/modules.repository";
import type { IModuleRepository } from "../../domain/modules.repository";
import { CreateModuleDto } from "../dtos/create-module.dto";
import { ModuleEntity } from "../../domain/module.entity";

@Injectable()
export class CreateModuleUseCase {
	constructor(
		@Inject(I_MODULE_REPOSITORY)
		private readonly moduleRepository: IModuleRepository,
	) { }

	async execute(dto: CreateModuleDto) {
		const module = new ModuleEntity({
			id: crypto.randomUUID(),
			course_id: dto.course_id,
			title: dto.title,
			description: dto.description ?? null,
			display_order: dto.display_order,
			created_at: new Date(),
		})

		await this.moduleRepository.save(module)
		return { success: true, message: "Módulo creado", module }
	}
}
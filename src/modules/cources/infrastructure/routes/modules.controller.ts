import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { CreateModuleUseCase } from "../../application/use-cases/create-module.use-case";
import { UpdateModuleUseCase } from "../../application/use-cases/update-module.use-case";
import { DeleteModuleUseCase } from "../../application/use-cases/delete-module.use-case";
import { GetModulesUseCase } from "../../application/use-cases/get-modules.use-case";
import { CreateModuleDto } from "../../application/dtos/create-module.dto";
import { UpdateModuleDto } from "../../application/dtos/update-module.dto";

@Controller()
export class ModulesController {
	constructor(
		private readonly createModule: CreateModuleUseCase,
		private readonly updateModule: UpdateModuleUseCase,
		private readonly deleteModule: DeleteModuleUseCase,
		private readonly getModules: GetModulesUseCase,
	) { }

	@Get('courses/:courseId/modules')
	async getByCourse(@Param('courseId') courseId: string) {
		return this.getModules.executeByCourse(courseId)
	}

	@Get('modules/:id')
	async getById(@Param('id') id: string) {
		return this.getModules.executeById(id)
	}

	@Post('courses/:courseId/modules')
	async create(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
		dto.course_id = courseId
		return this.createModule.execute(dto)
	}

	@Patch('modules/:id')
	async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
		return this.updateModule.execute(id, dto)
	}

	@Delete('modules/:id')
	async delete(@Param('id') id: string) {
		return this.deleteModule.execute(id)
	}
}
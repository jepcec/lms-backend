import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { CreateMaterialUseCase } from "../../application/use-cases/create-material.use-case";
import { DeleteMaterialUseCase } from "../../application/use-cases/delete-material.use-case";
import { GetMaterialsUseCase } from "../../application/use-cases/get-materials.use-case";
import { CreateMaterialDto } from "../../application/dtos/create-material.dto";

@Controller()
export class MaterialsController {
	constructor(
		private readonly createMaterial: CreateMaterialUseCase,
		private readonly deleteMaterial: DeleteMaterialUseCase,
		private readonly getMaterials: GetMaterialsUseCase,
	) { }

	@Get('sessions/:sessionId/materials')
	async getBySession(@Param('sessionId') sessionId: string) {
		return this.getMaterials.executeBySession(sessionId)
	}

	@Post('sessions/:sessionId/materials')
	async create(@Param('sessionId') sessionId: string, @Body() dto: CreateMaterialDto) {
		dto.session_id = sessionId
		return this.createMaterial.execute(dto)
	}

	@Delete('materials/:id')
	async delete(@Param('id') id: string) {
		return this.deleteMaterial.execute(id)
	}
}
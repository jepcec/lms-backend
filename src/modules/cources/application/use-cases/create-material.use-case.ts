import { Injectable, Inject } from "@nestjs/common";
import { I_MATERIAL_REPOSITORY } from "../../domain/materials.repository";
import type { IMaterialRepository } from "../../domain/materials.repository";
import { CreateMaterialDto } from "../dtos/create-material.dto";
import { MaterialEntity } from "../../domain/material.entity";

@Injectable()
export class CreateMaterialUseCase {
	constructor(
		@Inject(I_MATERIAL_REPOSITORY)
		private readonly materialRepository: IMaterialRepository,
	) { }

	async execute(dto: CreateMaterialDto) {
		const material = new MaterialEntity({
			id: crypto.randomUUID(),
			session_id: dto.session_id,
			name: dto.name,
			drive_url: dto.drive_url,
			type: dto.type,
			created_at: new Date(),
		})

		await this.materialRepository.save(material)
		return {
			success: true,
			message: "Material creado",
			material: {
				id: material.id,
				name: material.name,
				drive_url: material.drive_url,
				type: material.type,
			},
		}
	}
}
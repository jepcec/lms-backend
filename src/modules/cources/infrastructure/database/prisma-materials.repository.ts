import { Injectable } from "@nestjs/common";
import { IMaterialRepository } from "../../domain/materials.repository";
import { PrismaService } from "src/core/database/prisma.service";
import { MaterialEntity } from "../../domain/material.entity";

@Injectable()
export class PrismaMaterialRepository implements IMaterialRepository {
	constructor(private readonly prisma: PrismaService) { }

	async findById(id: string): Promise<MaterialEntity | null> {
		const material = await this.prisma.material.findUnique({ where: { id } })
		if (!material) return null
		return new MaterialEntity({
			id: material.id,
			session_id: material.session_id,
			name: material.name,
			drive_url: material.drive_url,
			type: material.type as any,
			created_at: material.created_at,
		})
	}

	async findBySessionId(sessionId: string): Promise<MaterialEntity[]> {
		const materials = await this.prisma.material.findMany({
			where: { session_id: sessionId },
		})
		return materials.map(m => new MaterialEntity({
			id: m.id,
			session_id: m.session_id,
			name: m.name,
			drive_url: m.drive_url,
			type: m.type as any,
			created_at: m.created_at,
		}))
	}

	async save(material: MaterialEntity): Promise<void> {
		await this.prisma.material.upsert({
			where: { id: material.id },
			update: {
				name: material.name,
				drive_url: material.drive_url,
				type: material.type,
			},
			create: {
				id: material.id,
				session_id: material.session_id,
				name: material.name,
				drive_url: material.drive_url,
				type: material.type,
			}
		})
	}

	async delete(id: string): Promise<void> {
		await this.prisma.material.delete({ where: { id } })
	}
}
import { Injectable } from "@nestjs/common";
import { IModuleRepository } from "../../domain/modules.repository";
import { PrismaService } from "src/core/database/prisma.service";
import { ModuleEntity } from "../../domain/module.entity";

@Injectable()
export class PrismaModuleRepository implements IModuleRepository {
	constructor(private readonly prisma: PrismaService) { }

	async findById(id: string): Promise<ModuleEntity | null> {
		const module = await this.prisma.module.findUnique({ where: { id } })
		if (!module) return null
		return new ModuleEntity({
			id: module.id,
			course_id: module.course_id,
			title: module.title,
			description: module.description,
			display_order: module.display_order,
			created_at: module.created_at,
		})
	}

	async findByCourseId(courseId: string): Promise<ModuleEntity[]> {
		const modules = await this.prisma.module.findMany({
			where: { course_id: courseId },
			orderBy: { display_order: 'asc' }
		})
		return modules.map(m => new ModuleEntity({
			id: m.id,
			course_id: m.course_id,
			title: m.title,
			description: m.description,
			display_order: m.display_order,
			created_at: m.created_at,
		}))
	}

	async save(module: ModuleEntity): Promise<void> {
		await this.prisma.module.upsert({
			where: { id: module.id },
			update: {
				title: module.title,
				description: module.description,
				display_order: module.display_order,
			},
			create: {
				id: module.id,
				course_id: module.course_id,
				title: module.title,
				description: module.description,
				display_order: module.display_order,
			}
		})
	}

	async delete(id: string): Promise<void> {
		await this.prisma.module.delete({ where: { id } })
	}
}
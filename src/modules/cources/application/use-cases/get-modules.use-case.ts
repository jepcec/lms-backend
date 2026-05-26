import { Injectable, Inject } from "@nestjs/common";
import { I_MODULE_REPOSITORY } from "../../domain/modules.repository";
import type { IModuleRepository } from "../../domain/modules.repository";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class GetModulesUseCase {
	constructor(
		@Inject(I_MODULE_REPOSITORY)
		private readonly moduleRepository: IModuleRepository,
		private readonly prisma: PrismaService,
	) { }

	async executeByCourse(courseId: string) {
		const modules = await this.prisma.module.findMany({
			where: { course_id: courseId },
			orderBy: { display_order: 'asc' },
			include: {
				sessions: { select: { id: true, duration_minutes: true } },
			},
		});
		return modules.map(m => ({
			id: m.id,
			title: m.title,
			description: m.description,
			display_order: m.display_order,
			sessions_count: m.sessions.length,
			total_duration: m.sessions.reduce((sum, s) => sum + s.duration_minutes, 0),
		}));
	}

	async executeById(id: string) {
		const module = await this.moduleRepository.findById(id);
		if (!module) throw new Error("Módulo no encontrado");
		return {
			id: module.id,
			title: module.title,
			description: module.description,
			display_order: module.display_order,
		};
	}
}
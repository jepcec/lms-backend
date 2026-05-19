import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { AdminFiltersDto } from "../dtos/admin-filters.dto";

@Injectable()
export class GetTopFinalizacionUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(filters: AdminFiltersDto) {
		const where: Record<string, unknown> = {
			status: "published",
			deleted_at: null,
		};
		if (filters.categoria_id) {
			where.category_id = filters.categoria_id;
		}

		const courses = await this.prisma.course.findMany({
			where,
			select: {
				id: true,
				title: true,
				enrolled_count: true,
				enrollments: {
					where: {
						...(filters.desde || filters.hasta
							? {
									enrolled_at: {
										...(filters.desde ? { gte: new Date(filters.desde) } : {}),
										...(filters.hasta ? { lte: new Date(filters.hasta) } : {}),
									},
								}
							: {}),
					},
					select: { completed_at: true },
				},
			},
		});

		const result = courses
			.map((course) => {
				const total = course.enrollments.length;
				const completed = course.enrollments.filter((e) => e.completed_at).length;
				return {
					id: course.id,
					title: course.title,
					enrolled_count: course.enrolled_count,
					completion_rate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
				};
			})
			.sort((a, b) => b.completion_rate - a.completion_rate)
			.slice(0, 10);

		return result;
	}
}

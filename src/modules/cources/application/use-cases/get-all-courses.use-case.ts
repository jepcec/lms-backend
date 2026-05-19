import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CursoParams } from "../dtos/curso-params.dto";

@Injectable()
export class GetAllCoursesUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(params: CursoParams) {
		const page = Number(params.page) || 1;
		const limit = Number(params.limit) || 10;
		const skip = (page - 1) * limit;

		const where: Record<string, unknown> = { deleted_at: null };

		if (params.search) {
			where.OR = [
				{ title: { contains: params.search, mode: "insensitive" } },
				{ tagline: { contains: params.search, mode: "insensitive" } },
			];
		}

		if (params.status) {
			where.status = params.status;
		}

		if (params.categoria_id) {
			where.category_id = params.categoria_id;
		}

		const [data, total] = await Promise.all([
			this.prisma.course.findMany({
				where,
				skip,
				take: limit,
				include: {
					category: true,
					instructors: {
						orderBy: { display_order: "asc" },
					},
				},
				orderBy: { created_at: "desc" },
			}),
			this.prisma.course.count({ where }),
		]);

		const total_pages = Math.ceil(total / limit);

		return {
			data: data.map((course) => ({
				id: course.id,
				category_id: course.category_id,
				category: course.category,
				title: course.title,
				slug: course.slug,
				tagline: course.tagline,
				description: course.description,
				thumbnail_url: course.thumbnail_url,
				level: course.level,
				software_tools: course.software_tools,
				price: Number(course.price),
				discount_price: course.discount_price ? Number(course.discount_price) : undefined,
				currency: course.currency,
				access_duration: course.access_duration,
				prerequisites: course.prerequisites,
				outcomes: course.outcomes,
				status: course.status,
				published_at: course.published_at?.toISOString(),
				avg_rating: Number(course.avg_rating),
				review_count: course.review_count,
				enrolled_count: course.enrolled_count,
				total_duration_minutes: course.total_duration_minutes,
				instructors: course.instructors,
				created_by: course.created_by,
				created_at: course.created_at.toISOString(),
				updated_at: course.updated_at.toISOString(),
			})),
			total,
			page,
			limit,
			total_pages,
		};
	}
}

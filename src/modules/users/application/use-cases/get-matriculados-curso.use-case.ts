import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { MatriculadosQueryDto } from "../dtos/matriculados-query.dto";

@Injectable()
export class GetMatriculadosCursoUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(cursoId: string, params: MatriculadosQueryDto) {
		const course = await this.prisma.course.findUnique({
			where: { id: cursoId },
			select: { id: true },
		});

		if (!course) {
			throw new NotFoundException("Curso no encontrado");
		}

		const page = params.page ?? 1;
		const limit = params.limit ?? 10;
		const skip = (page - 1) * limit;

		const where: Record<string, unknown> = { course_id: cursoId };

		if (params.search) {
			where.student = {
				OR: [
					{ first_name: { contains: params.search, mode: "insensitive" } },
					{ last_name: { contains: params.search, mode: "insensitive" } },
					{ email: { contains: params.search, mode: "insensitive" } },
				],
			};
		}

		if (params.status === "activo") {
			where.completed_at = null;
		} else if (params.status === "completado") {
			where.completed_at = { not: null };
		} else if (params.status === "inactivo") {
			where.progress_percent = 0;
		}

		if (params.enrollment_type) {
			where.enrollment_type = params.enrollment_type;
		}

		const [data, total, statsData] = await Promise.all([
			this.prisma.enrollment.findMany({
				where,
				skip,
				take: limit,
				include: {
					student: {
						select: { id: true, first_name: true, last_name: true, email: true },
					},
				},
				orderBy: { enrolled_at: "desc" },
			}),
			this.prisma.enrollment.count({ where }),
			this.getStats(cursoId),
		]);

		const total_pages = Math.ceil(total / limit);

		return {
			data: data.map((enrollment) => ({
				enrollment_id: enrollment.id,
				user: enrollment.student,
				enrolled_at: enrollment.enrolled_at.toISOString(),
				progress_percent: enrollment.progress_percent.toNumber(),
				last_accessed_at: enrollment.last_accessed_at?.toISOString(),
				status: enrollment.completed_at
					? "completado"
					: enrollment.progress_percent.toNumber() === 0
						? "inactivo"
						: "activo",
				enrollment_type: enrollment.enrollment_type,
				offline_payment_method: enrollment.offline_payment_method ?? undefined,
			})),
			total,
			total_pages,
			stats: statsData,
		};
	}

	private async getStats(cursoId: string) {
		const [
			total,
			avgProgressResult,
			activos7DiasResult,
			tasaFinalizacionResult,
		] = await Promise.all([
			this.prisma.enrollment.count({ where: { course_id: cursoId } }),
			this.prisma.enrollment.aggregate({
				_avg: { progress_percent: true },
				where: { course_id: cursoId },
			}),
			this.prisma.enrollment.count({
				where: {
					course_id: cursoId,
					last_accessed_at: {
						gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
					},
				},
			}),
			this.prisma.enrollment.count({
				where: { course_id: cursoId, completed_at: { not: null } },
			}),
		]);

		return {
			total,
			avg_progress: Math.round((avgProgressResult._avg.progress_percent?.toNumber() ?? 0) * 100) / 100,
			activos_7_dias: activos7DiasResult,
			tasa_finalizacion: total > 0
				? Math.round((tasaFinalizacionResult / total) * 10000) / 100
				: 0,
		};
	}
}

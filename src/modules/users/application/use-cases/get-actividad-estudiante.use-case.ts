import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";

@Injectable()
export class GetActividadEstudianteUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(userId: string, courseId: string) {
		const enrollment = await this.prisma.enrollment.findUnique({
			where: { user_id_course_id: { user_id: userId, course_id: courseId } },
			include: {
				student: {
					select: { id: true, first_name: true, last_name: true, email: true },
				},
				course: { select: { id: true, title: true } },
				lesson_progress: {
					include: {
						session: {
							select: {
								title: true,
								duration_minutes: true,
								module: { select: { title: true } },
							},
						},
					},
				},
			},
		});

		if (!enrollment) {
			throw new NotFoundException("Matrícula no encontrada");
		}

		const sessions = enrollment.lesson_progress.map((lp) => ({
			module_title: lp.session.module.title,
			session_title: lp.session.title,
			duration_minutes: lp.session.duration_minutes,
			watched_seconds: lp.watched_seconds,
			percent_watched: lp.session.duration_minutes > 0
				? Math.round((lp.watched_seconds / (lp.session.duration_minutes * 60)) * 10000) / 100
				: 0,
			completed: lp.completed,
			last_watched_at: lp.last_watched_at?.toISOString(),
		}));

		const activityByDay = this.buildActivityByDay(enrollment.lesson_progress);

		return {
			enrollment: {
				enrolled_at: enrollment.enrolled_at.toISOString(),
				progress_percent: enrollment.progress_percent.toNumber(),
				last_accessed_at: enrollment.last_accessed_at?.toISOString(),
				completed_at: enrollment.completed_at?.toISOString(),
				total_watched_seconds: enrollment.lesson_progress.reduce(
					(sum, lp) => sum + lp.watched_seconds,
					0,
				),
			},
			user: enrollment.student,
			course: enrollment.course,
			sessions,
			activity_by_day: activityByDay,
		};
	}

	private buildActivityByDay(
		lessonProgress: Array<{ watched_seconds: number; last_watched_at: Date }>,
	) {
		const dayMap = new Map<string, number>();

		for (const lp of lessonProgress) {
			if (lp.watched_seconds === 0) continue;
			const dateStr = lp.last_watched_at.toISOString().split("T")[0];
			const current = dayMap.get(dateStr) ?? 0;
			dayMap.set(dateStr, current + lp.watched_seconds / 3600);
		}

		return Array.from(dayMap.entries())
			.map(([date, hours]) => ({
				date,
				hours: Math.round(hours * 100) / 100,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}
}

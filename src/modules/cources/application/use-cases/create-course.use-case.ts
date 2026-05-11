import { Injectable, Inject } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "../../domain/courses.repository";
import type { ICourseRepository } from "../../domain/courses.repository";
import { CreateCourseDto } from "../dtos/create-course.dto";
import { CourseEntity } from "../../domain/course.entity";

@Injectable()
export class CreateCourseUseCase {
	constructor(
		@Inject(I_COURSE_REPOSITORY)
		private readonly courseRepository: ICourseRepository,
	) { }

	async execute(dto: CreateCourseDto, createdBy: string) {
		const exists = await this.courseRepository.findBySlug(dto.slug)
		if (exists) {
			throw new Error("Curso con este slug ya existe")
		}

		const course = new CourseEntity({
			id: crypto.randomUUID(),
			...dto,
			discount_price: dto.discount_price ?? null,
			avg_rating: 0,
			review_count: 0,
			enrolled_count: 0,
			total_duration_minutes: 0,
			created_by: createdBy,
			published_at: dto.status === 'published' ? new Date() : null,
			created_at: new Date(),
			updated_at: new Date(),
			deleted_at: null,
		})

		await this.courseRepository.save(course)
		return {
			success: true,
			message: "Curso creado exitosamente",
			course: {
				id: course.id,
				title: course.title,
				slug: course.slug,
				status: course.status,
			}
		}
	}
}

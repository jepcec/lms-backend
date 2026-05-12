import { Injectable, Inject } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "../../domain/courses.repository";
import type { ICourseRepository } from "../../domain/courses.repository";
import { UpdateCourseDto } from "../dtos/update-course.dto";

@Injectable()
export class UpdateCourseUseCase {
	constructor(
		@Inject(I_COURSE_REPOSITORY)
		private readonly courseRepository: ICourseRepository,
	) { }

	async execute(id: string, dto: UpdateCourseDto) {
		const course = await this.courseRepository.findById(id)
		if (!course) {
			throw new Error("Curso no encontrado")
		}

		const updatedProps: Record<string, any> = { ...dto }
		if (dto.status === 'published' && !course.published_at) {
			updatedProps.published_at = new Date()
		}

		Object.assign(course, updatedProps)
		await this.courseRepository.save(course)

		return {
			success: true,
			message: "Curso actualizado exitosamente",
			course: {
				id: course.id,
				title: course.title,
				status: course.status,
			}
		}
	}
}
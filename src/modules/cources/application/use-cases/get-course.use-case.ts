import { Injectable, Inject } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "../../domain/courses.repository";
import type { ICourseRepository } from "../../domain/courses.repository";

@Injectable()
export class GetCourseUseCase {
	constructor(
		@Inject(I_COURSE_REPOSITORY)
		private readonly courseRepository: ICourseRepository,
	) { }

	async execute(id: string) {
		const course = await this.courseRepository.findById(id)
		if (!course) {
			throw new Error("Curso no encontrado")
		}
		return course
	}

	async executeBySlug(slug: string) {
		const course = await this.courseRepository.findBySlug(slug)
		if (!course) {
			throw new Error("Curso no encontrado")
		}
		return course
	}
}
import { Injectable, Inject } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "../../domain/courses.repository";
import type { ICourseRepository } from "../../domain/courses.repository";

@Injectable()
export class DeleteCourseUseCase {
	constructor(
		@Inject(I_COURSE_REPOSITORY)
		private readonly courseRepository: ICourseRepository,
	) { }

	async execute(id: string) {
		const course = await this.courseRepository.findById(id)
		if (!course) {
			throw new Error("Curso no encontrado")
		}
		await this.courseRepository.delete(id)
		return { success: true, message: "Curso eliminado" }
	}
}
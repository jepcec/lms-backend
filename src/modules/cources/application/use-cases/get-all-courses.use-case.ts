import { Injectable, Inject } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "../../domain/courses.repository";
import type { ICourseRepository } from "../../domain/courses.repository";

@Injectable()
export class GetAllCoursesUseCase {
	constructor(
		@Inject(I_COURSE_REPOSITORY)
		private readonly courseRepository: ICourseRepository,
	) { }

	async execute() {
		const courses = await this.courseRepository.findAll()
		return courses
	}
}
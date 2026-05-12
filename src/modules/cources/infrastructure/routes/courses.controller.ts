import { Controller, Get, Post, Put, Patch, Delete, Body, Param } from "@nestjs/common";
import { CreateCourseUseCase } from "../../application/use-cases/create-course.use-case";
import { CreateCourseDto } from "../../application/dtos/create-course.dto";
import { UpdateCourseUseCase } from "../../application/use-cases/update-course.use-case";
import { UpdateCourseDto } from "../../application/dtos/update-course.dto";
import { GetCourseUseCase } from "../../application/use-cases/get-course.use-case";
import { GetAllCoursesUseCase } from "../../application/use-cases/get-all-courses.use-case";
import { DeleteCourseUseCase } from "../../application/use-cases/delete-course.use-case";

@Controller('courses')
export class CoursesController {
	constructor(
		private readonly createCourse: CreateCourseUseCase,
		private readonly updateCourse: UpdateCourseUseCase,
		private readonly getCourse: GetCourseUseCase,
		private readonly getAllCourses: GetAllCoursesUseCase,
		private readonly deleteCourse: DeleteCourseUseCase,
	) { }

	@Get()
	async getAll() {
		return this.getAllCourses.execute()
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		return this.getCourse.execute(id)
	}

	@Get('slug/:slug')
	async getBySlug(@Param('slug') slug: string) {
		return this.getCourse.executeBySlug(slug)
	}

	@Post()
	async create(@Body() dto: CreateCourseDto) {
		return this.createCourse.execute(dto, 'system-user-id')
	}

	@Patch(':id')
	async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
		return this.updateCourse.execute(id, dto)
	}

	@Delete(':id')
	async delete(@Param('id') id: string) {
		return this.deleteCourse.execute(id)
	}
}
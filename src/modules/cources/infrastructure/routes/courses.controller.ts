import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from "@nestjs/common";
import { Public } from "../../../auth/decorators/public.decorator";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../../auth/decorators/current-user.decorator";
import { CreateCourseUseCase } from "../../application/use-cases/create-course.use-case";
import { CreateCourseDto } from "../../application/dtos/create-course.dto";
import { UpdateCourseUseCase } from "../../application/use-cases/update-course.use-case";
import { UpdateCourseDto } from "../../application/dtos/update-course.dto";
import { GetCourseUseCase } from "../../application/use-cases/get-course.use-case";
import { GetAllCoursesUseCase } from "../../application/use-cases/get-all-courses.use-case";
import { DeleteCourseUseCase } from "../../application/use-cases/delete-course.use-case";
import { GetFeaturedCoursesUseCase } from "../../application/use-cases/get-featured-courses.use-case";

@Controller('courses')
export class CoursesController {
	constructor(
		private readonly createCourse: CreateCourseUseCase,
		private readonly updateCourse: UpdateCourseUseCase,
		private readonly getCourse: GetCourseUseCase,
		private readonly getAllCourses: GetAllCoursesUseCase,
		private readonly deleteCourse: DeleteCourseUseCase,
		private readonly getFeaturedCourses: GetFeaturedCoursesUseCase,
	) { }

	@Get()
	@Public()
	async getAll() {
		return this.getAllCourses.execute()
	}

	@Get('featured')
	@Public()
	async getFeatured(@Query('limit') limit?: string) {
		const parsedLimit = limit ? parseInt(limit, 10) : 8;
		return this.getFeaturedCourses.execute(parsedLimit);
	}

	@Get(':id')
	@Public()
	async getById(@Param('id') id: string) {
		return this.getCourse.execute(id)
	}

	@Get('slug/:slug')
	@Public()
	async getBySlug(@Param('slug') slug: string) {
		return this.getCourse.executeBySlug(slug)
	}

	@Post()
	@Roles('admin')
	async create(@Body() dto: CreateCourseDto, @CurrentUser('userId') userId: string) {
		console.log("Entrando")
		return this.createCourse.execute(dto, userId)
	}

	@Patch(':id')
	@Roles('admin')
	async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
		return this.updateCourse.execute(id, dto)
	}

	@Delete(':id')
	@Roles('admin')
	async delete(@Param('id') id: string) {
		return this.deleteCourse.execute(id)
	}
}

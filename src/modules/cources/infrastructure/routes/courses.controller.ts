import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../../../auth/decorators/public.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { CreateCourseUseCase } from '../../application/use-cases/create-course.use-case';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';
import { UpdateCourseUseCase } from '../../application/use-cases/update-course.use-case';
import { UpdateCourseDto } from '../../application/dtos/update-course.dto';
import { GetCourseUseCase } from '../../application/use-cases/get-course.use-case';
import { GetAllCoursesUseCase } from '../../application/use-cases/get-all-courses.use-case';
import { ListCatalogUseCase } from '../../application/use-cases/list-catalog.use-case';
import { DeleteCourseUseCase } from '../../application/use-cases/delete-course.use-case';
import { GetFeaturedCoursesUseCase } from '../../application/use-cases/get-featured-courses.use-case';
import { GetSoftwaresUseCase } from '../../application/use-cases/get-softwares.use-case';
import { CursoParams } from '../../application/dtos/curso-params.dto';
import { UploadThumbnailUseCase } from '../../application/use-cases/upload-thumbnail.use-case';
import { AddInstructorUseCase } from '../../application/use-cases/add-instructor.use-case';
import { RemoveInstructorUseCase } from '../../application/use-cases/remove-instructor.use-case';
import { CreateInstructorDto } from '../../application/dtos/create-instructor.dto';
import { GetMatriculadosCursoUseCase } from '../../application/use-cases/get-matriculados-curso.use-case';
import { GetCourseSoftwaresUseCase } from '../../application/use-cases/get-course-softwares.use-case';
import type { Express } from 'express';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly createCourse: CreateCourseUseCase,
    private readonly updateCourse: UpdateCourseUseCase,
    private readonly getCourse: GetCourseUseCase,
    private readonly getAllCourses: GetAllCoursesUseCase,
    private readonly listCatalog: ListCatalogUseCase,
    private readonly deleteCourse: DeleteCourseUseCase,
    private readonly getFeaturedCourses: GetFeaturedCoursesUseCase,
    private readonly getSoftwaresUseCase: GetSoftwaresUseCase,
    private readonly uploadThumbnail: UploadThumbnailUseCase,
    private readonly addInstructor: AddInstructorUseCase,
    private readonly removeInstructor: RemoveInstructorUseCase,
    private readonly getMatriculadosCurso: GetMatriculadosCursoUseCase,
    private readonly getCourseSoftwares: GetCourseSoftwaresUseCase,
  ) {}

  @Get()
  @Public()
  async getAll(@Query() params: CursoParams) {
    return this.getAllCourses.execute(params);
  }

  @Get('catalog')
  @Public()
  async getCatalog(@Query() params: CursoParams) {
    return this.listCatalog.execute(params);
  }

  @Get('featured')
  @Public()
  async getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 8;
    return this.getFeaturedCourses.execute(parsedLimit);
  }

  @Get('softwares')
  @Public()
  async getSoftwares() {
    return this.getSoftwaresUseCase.execute();
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    return this.getCourse.execute(id);
  }

  @Get('slug/:slug')
  @Public()
  async getBySlug(@Param('slug') slug: string) {
    return this.getCourse.executeBySlug(slug);
  }

  @Post()
  @Roles('admin', 'soporte')
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createCourse.execute(dto, userId);
  }

  @Patch(':id')
  @Roles('admin', 'soporte')
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.updateCourse.execute(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'soporte')
  async delete(@Param('id') id: string) {
    return this.deleteCourse.execute(id);
  }

  @Post(':id/thumbnail')
  @Roles('admin', 'soporte')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new Error('Only image files are allowed (jpg, jpeg, png, webp)'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadThumbnailHandler(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadThumbnail.execute(id, file);
  }

  @Post(':id/instructors')
  @Roles('admin', 'soporte')
  async addInstructorHandler(
    @Param('id') id: string,
    @Body() dto: CreateInstructorDto,
  ) {
    return this.addInstructor.execute(id, dto);
  }

  @Delete(':id/instructors/:instructorId')
  @Roles('admin', 'soporte')
  async removeInstructorHandler(
    @Param('id') id: string,
    @Param('instructorId') instructorId: string,
  ) {
    return this.removeInstructor.execute(id, instructorId);
  }

  @Get(':id/matriculados')
  @Roles('admin')
  async getMatriculadosHandler(
    @Param('id') id: string,
    @Query() params: { page?: number; limit?: number; search?: string },
  ) {
    return this.getMatriculadosCurso.execute(id, params);
  }
}

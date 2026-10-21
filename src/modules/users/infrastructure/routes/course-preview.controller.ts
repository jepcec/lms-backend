import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { GetCourseContentUseCase } from '../../application/use-cases/get-course-content.use-case';

// Vista previa del curso "como lo ve el estudiante" para quienes lo editan.
// Separado de /student/* (que exige matrícula y registra avance).
@Controller('courses')
@Roles('admin', 'soporte')
export class CoursePreviewController {
  constructor(private readonly getCourseContent: GetCourseContentUseCase) {}

  @Get(':courseId/preview-content')
  async getPreviewContent(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.getCourseContent.executePreview(courseId);
  }
}

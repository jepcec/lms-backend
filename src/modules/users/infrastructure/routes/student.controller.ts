import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { GetMyEnrollmentsUseCase } from '../../application/use-cases/get-my-enrollments.use-case';
import { GetCourseContentUseCase } from '../../application/use-cases/get-course-content.use-case';
import { GetCourseProgressUseCase } from '../../application/use-cases/get-course-progress.use-case';
import { UpdateSessionProgressUseCase } from '../../application/use-cases/update-session-progress.use-case';

@Controller('student')
@Roles('estudiante')
export class StudentController {
  constructor(
    private readonly getMyEnrollments: GetMyEnrollmentsUseCase,
    private readonly getCourseContent: GetCourseContentUseCase,
    private readonly getCourseProgress: GetCourseProgressUseCase,
    private readonly updateSessionProgress: UpdateSessionProgressUseCase,
  ) {}

  @Get('enrollments')
  async getMyEnrollmentsHandler(@CurrentUser('userId') userId: string) {
    return await this.getMyEnrollments.execute(userId);
  }

  @Get('courses/:courseId/content')
  async getCourseContentHandler(
    @CurrentUser('userId') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return await this.getCourseContent.execute(userId, courseId);
  }

  @Get('progress/courses/:courseId')
  async getCourseProgressHandler(
    @CurrentUser('userId') userId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return await this.getCourseProgress.execute(userId, courseId);
  }

  @Put('progress/sessions/:sessionId')
  async updateSessionProgressHandler(
    @CurrentUser('userId') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body('watched_seconds') watchedSeconds: number,
  ) {
    return this.updateSessionProgress.execute(
      userId,
      sessionId,
      watchedSeconds,
    );
  }
}

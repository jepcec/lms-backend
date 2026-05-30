import { Injectable, Inject } from '@nestjs/common';
import { I_COURSE_REPOSITORY } from '../../domain/courses.repository';
import type { ICourseRepository } from '../../domain/courses.repository';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { CourseEntity } from '../../domain/course.entity';
import type {
  CourseStatus,
  CourseLevel,
  CourseCurrency,
  CourseAccessDuration,
} from '../../domain/course.entity';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(I_COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(id: string, dto: UpdateCourseDto) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    const published_at =
      dto.status === 'published' && !course.published_at
        ? new Date()
        : course.published_at;

    const updated = new CourseEntity({
      id: course.id,
      category_id: course.category_id,
      title: dto.title ?? course.title,
      slug: course.slug,
      tagline: dto.tagline ?? course.tagline,
      description: dto.description ?? course.description,
      thumbnail_url: dto.thumbnail_url ?? course.thumbnail_url,
      thumbnail_public_id: course.thumbnail_public_id,
      level: (dto.level as CourseLevel) ?? course.level,
      software_tools: dto.software_tools ?? course.software_tools,
      price: dto.price ?? course.price,
      discount_price:
        dto.discount_price !== undefined
          ? dto.discount_price
          : course.discount_price,
      currency: (dto.currency as CourseCurrency) ?? course.currency,
      access_duration:
        (dto.access_duration as CourseAccessDuration) ?? course.access_duration,
      prerequisites: dto.prerequisites ?? course.prerequisites,
      outcomes: dto.outcomes ?? course.outcomes,
      status: (dto.status as CourseStatus) ?? course.status,
      published_at,
      avg_rating: course.avg_rating,
      review_count: course.review_count,
      enrolled_count: course.enrolled_count,
      total_duration_minutes: course.total_duration_minutes,
      created_by: course.created_by,
      created_at: course.created_at,
      updated_at: new Date(),
      deleted_at: course.deleted_at,
    });
    await this.courseRepository.save(updated);

    return {
      success: true,
      message: 'Curso actualizado exitosamente',
      course: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
      },
    };
  }
}

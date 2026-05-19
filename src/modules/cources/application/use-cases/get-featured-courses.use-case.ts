import { Injectable, Inject } from '@nestjs/common';
import { I_COURSE_REPOSITORY,type ICourseRepository } from '../../domain/courses.repository';

@Injectable()
export class GetFeaturedCoursesUseCase {
  constructor(
    @Inject(I_COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(limit: number) {
    const courses = await this.courseRepository.findFeatured(limit);
    // Return wrapped in `{ data: courses }` to match frontend expectation of `data.data` structure when using generic api client mapping
    return { data: courses };
  }
}

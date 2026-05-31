import { CourseEntity } from './course.entity';

export interface ICourseRepository {
  findById(id: string): Promise<CourseEntity | null>;
  findBySlug(slug: string): Promise<CourseEntity | null>;
  save(course: CourseEntity): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<CourseEntity[]>;
  findFeatured(limit: number): Promise<CourseEntity[]>;
}

export const I_COURSE_REPOSITORY = Symbol('ICourseRespository');

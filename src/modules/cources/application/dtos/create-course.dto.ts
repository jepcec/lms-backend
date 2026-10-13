import { CourseLevel, CourseStatus } from '../../domain/course.entity';

export interface InstructorInput {
  full_name: string;
  title: string;
  description?: string;
  photo_url?: string;
}

export class CreateCourseDto {
  category_id: string;
  title: string;
  slug?: string;
  tagline: string;
  description: string;
  thumbnail_url?: string;
  level: CourseLevel;
  software_tools: string[];
  price_pen: number;
  discount_price_pen?: number;
  price_usd: number;
  discount_price_usd?: number;
  access_duration_months: number;
  prerequisites: string[];
  outcomes: string[];
  status: CourseStatus;
  instructors?: InstructorInput[];
  academic_hours?: number;
}

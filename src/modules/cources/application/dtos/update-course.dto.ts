import type { InstructorInput } from './create-course.dto';

export class UpdateCourseDto {
  title?: string;
  tagline?: string;
  description?: string;
  thumbnail_url?: string;
  level?: string;
  software_tools?: string[];
  price?: number;
  discount_price?: number | null;
  currency?: string;
  access_duration?: string;
  prerequisites?: string[];
  outcomes?: string[];
  status?: string;
  instructors?: InstructorInput[];
  certification_mode?: string;
  certificate_template_id?: string | null;
  constancia_template_id?: string | null;
}

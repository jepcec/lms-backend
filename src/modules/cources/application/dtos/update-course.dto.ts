import type { InstructorInput } from './create-course.dto';

export class UpdateCourseDto {
  title?: string;
  tagline?: string;
  description?: string;
  thumbnail_url?: string;
  level?: string;
  software_tools?: string[];
  price_pen?: number;
  discount_price_pen?: number | null;
  price_usd?: number;
  discount_price_usd?: number | null;
  access_duration_months?: number;
  prerequisites?: string[];
  outcomes?: string[];
  status?: string;
  instructors?: InstructorInput[];
  academic_hours?: number;
  certification_mode?: string;
  certificate_template_id?: string | null;
  constancia_template_id?: string | null;
}

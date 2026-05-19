import { CourseLevel, CourseCurrency, CourseAccessDuration, CourseStatus } from "../../domain/course.entity";

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
	price: number;
	discount_price?: number;
	currency: CourseCurrency;
	access_duration: CourseAccessDuration;
	prerequisites: string[];
	outcomes: string[];
	status: CourseStatus;
	instructors?: InstructorInput[];
}

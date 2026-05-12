import { CourseLevel, CourseCurrency, CourseAccessDuration, CourseStatus } from "../../domain/course.entity";

export class CreateCourseDto {
	category_id: string;
	title: string;
	slug: string;
	tagline: string;
	description: string;
	thumbnail_url: string;
	level: CourseLevel;
	software_tools: string[];
	price: number;
	discount_price?: number;
	currency: CourseCurrency;
	access_duration: CourseAccessDuration;
	prerequisites: string[];
	outcomes: string[];
	status: CourseStatus;
}
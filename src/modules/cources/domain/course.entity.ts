export type CourseLevel = 'principiante' | 'intermedio' | 'avanzado'
export type CourseCurrency = 'USD' | 'PEN'
export type CourseAccessDuration = 'one_year' | 'lifetime'
export type CourseStatus = 'draft' | 'published' | 'archived'

export interface CourseProps {
	id: string;
	category_id: string;
	title: string;
	slug: string;
	tagline: string;
	description: string;
	thumbnail_url: string;
	level: CourseLevel;
	software_tools: string[];
	price: number;
	discount_price?: number | null;
	currency: CourseCurrency;
	access_duration: CourseAccessDuration;
	prerequisites: string[];
	outcomes: string[];
	status: CourseStatus;
	published_at?: Date | null;
	avg_rating: number;
	review_count: number;
	enrolled_count: number;
	total_duration_minutes: number;
	created_by: string;
	created_at: Date;
	updated_at: Date;
	deleted_at?: Date | null;
}

export class CourseEntity {
	private props: CourseProps

	constructor(props: CourseProps) {
		this.props = { ...props }
	}

	get id() { return this.props.id }
	get category_id() { return this.props.category_id }
	get title() { return this.props.title }
	get slug() { return this.props.slug }
	get tagline() { return this.props.tagline }
	get description() { return this.props.description }
	get thumbnail_url() { return this.props.thumbnail_url }
	get level() { return this.props.level }
	get software_tools() { return this.props.software_tools }
	get price() { return this.props.price }
	get discount_price() { return this.props.discount_price ?? null }
	get currency() { return this.props.currency }
	get access_duration() { return this.props.access_duration }
	get prerequisites() { return this.props.prerequisites }
	get outcomes() { return this.props.outcomes }
	get status() { return this.props.status }
	get published_at() { return this.props.published_at ?? null }
	get avg_rating() { return this.props.avg_rating }
	get review_count() { return this.props.review_count }
	get enrolled_count() { return this.props.enrolled_count }
	get total_duration_minutes() { return this.props.total_duration_minutes }
	get created_by() { return this.props.created_by }
	get created_at() { return this.props.created_at }
	get updated_at() { return this.props.updated_at }
	get deleted_at() { return this.props.deleted_at ?? null }

	get hasDiscount() { return this.props.discount_price !== null && this.props.discount_price !== undefined }
	get finalPrice() { return this.hasDiscount ? this.props.discount_price! : this.props.price }

	toJSON() {
		return {
			id: this.id,
			category_id: this.category_id,
			title: this.title,
			slug: this.slug,
			tagline: this.tagline,
			description: this.description,
			thumbnail_url: this.thumbnail_url,
			level: this.level,
			software_tools: this.software_tools,
			price: this.price,
			discount_price: this.discount_price,
			currency: this.currency,
			access_duration: this.access_duration,
			prerequisites: this.prerequisites,
			outcomes: this.outcomes,
			status: this.status,
			published_at: this.published_at,
			avg_rating: this.avg_rating,
			review_count: this.review_count,
			enrolled_count: this.enrolled_count,
			total_duration_minutes: this.total_duration_minutes,
			created_by: this.created_by,
			created_at: this.created_at,
			updated_at: this.updated_at,
			deleted_at: this.deleted_at
		}
	}
}


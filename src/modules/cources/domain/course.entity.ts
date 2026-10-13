export type CourseLevel = 'principiante' | 'intermedio' | 'avanzado';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CertificationMode = 'auto' | 'manual';

export interface CourseProps {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  thumbnail_url: string | null;
  thumbnail_public_id?: string | null;
  level: CourseLevel;
  software_tools: string[];
  price_pen: number;
  discount_price_pen?: number | null;
  price_usd: number;
  discount_price_usd?: number | null;
  access_duration_months: number;
  prerequisites: string[];
  outcomes: string[];
  status: CourseStatus;
  published_at?: Date | null;
  avg_rating: number;
  review_count: number;
  enrolled_count: number;
  total_duration_minutes: number;
  academic_hours: number;
  certification_mode: CertificationMode;
  certificate_template_id?: string | null;
  constancia_template_id?: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export class CourseEntity {
  private props: CourseProps;

  constructor(props: CourseProps) {
    this.props = { ...props };
  }

  get id() {
    return this.props.id;
  }
  get category_id() {
    return this.props.category_id;
  }
  get title() {
    return this.props.title;
  }
  get slug() {
    return this.props.slug;
  }
  get tagline() {
    return this.props.tagline;
  }
  get description() {
    return this.props.description;
  }
  get thumbnail_url() {
    return this.props.thumbnail_url;
  }
  get thumbnail_public_id() {
    return this.props.thumbnail_public_id ?? null;
  }
  get level() {
    return this.props.level;
  }
  get software_tools() {
    return this.props.software_tools;
  }
  get price_pen() {
    return this.props.price_pen;
  }
  get discount_price_pen() {
    return this.props.discount_price_pen ?? null;
  }
  get price_usd() {
    return this.props.price_usd;
  }
  get discount_price_usd() {
    return this.props.discount_price_usd ?? null;
  }
  get access_duration_months() {
    return this.props.access_duration_months;
  }
  get prerequisites() {
    return this.props.prerequisites;
  }
  get outcomes() {
    return this.props.outcomes;
  }
  get status() {
    return this.props.status;
  }
  get published_at() {
    return this.props.published_at ?? null;
  }
  get avg_rating() {
    return this.props.avg_rating;
  }
  get review_count() {
    return this.props.review_count;
  }
  get enrolled_count() {
    return this.props.enrolled_count;
  }
  get total_duration_minutes() {
    return this.props.total_duration_minutes;
  }
  get academic_hours() {
    return this.props.academic_hours;
  }
  get certification_mode() {
    return this.props.certification_mode;
  }
  get certificate_template_id() {
    return this.props.certificate_template_id ?? null;
  }
  get constancia_template_id() {
    return this.props.constancia_template_id ?? null;
  }
  get created_by() {
    return this.props.created_by;
  }
  get created_at() {
    return this.props.created_at;
  }
  get updated_at() {
    return this.props.updated_at;
  }
  get deleted_at() {
    return this.props.deleted_at ?? null;
  }

  get hasDiscountPen() {
    return (
      this.props.discount_price_pen !== null &&
      this.props.discount_price_pen !== undefined
    );
  }
  get finalPricePen() {
    return this.hasDiscountPen
      ? this.props.discount_price_pen!
      : this.props.price_pen;
  }
  get hasDiscountUsd() {
    return (
      this.props.discount_price_usd !== null &&
      this.props.discount_price_usd !== undefined
    );
  }
  get finalPriceUsd() {
    return this.hasDiscountUsd
      ? this.props.discount_price_usd!
      : this.props.price_usd;
  }

  toJSON() {
    return {
      id: this.id,
      category_id: this.category_id,
      title: this.title,
      slug: this.slug,
      tagline: this.tagline,
      description: this.description,
      thumbnail_url: this.thumbnail_url,
      thumbnail_public_id: this.thumbnail_public_id,
      level: this.level,
      software_tools: this.software_tools,
      price_pen: this.price_pen,
      discount_price_pen: this.discount_price_pen,
      final_price_pen: this.finalPricePen,
      price_usd: this.price_usd,
      discount_price_usd: this.discount_price_usd,
      final_price_usd: this.finalPriceUsd,
      access_duration_months: this.access_duration_months,
      prerequisites: this.prerequisites,
      outcomes: this.outcomes,
      status: this.status,
      published_at: this.published_at,
      avg_rating: this.avg_rating,
      review_count: this.review_count,
      enrolled_count: this.enrolled_count,
      total_duration_minutes: this.total_duration_minutes,
      academic_hours: this.academic_hours,
      certification_mode: this.certification_mode,
      certificate_template_id: this.certificate_template_id,
      constancia_template_id: this.constancia_template_id,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
}

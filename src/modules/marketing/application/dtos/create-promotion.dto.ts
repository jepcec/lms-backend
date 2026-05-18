export class CreatePromotionDto {
  title: string;
  image_url: string;
  destination_url?: string;
  destination_course_id?: string;
  display_order?: number;
  status: 'active' | 'inactive';
  starts_at?: string;
  ends_at?: string;
}

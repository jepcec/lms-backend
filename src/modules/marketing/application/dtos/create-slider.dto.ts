export class CreateSliderDto {
  title: string;
  type: 'courses' | 'banner';
  image_url?: string;
  destination_url?: string;
  position_on_page: 'top' | 'middle' | 'bottom';
  display_order?: number;
  status: 'active' | 'inactive';
  course_ids?: string[];
}

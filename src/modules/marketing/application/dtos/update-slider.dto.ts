import { CreateSliderDto } from './create-slider.dto';

export class UpdateSliderDto implements Partial<CreateSliderDto> {
  title?: string;
  subtitle?: string;
  type?: 'courses' | 'banner';
  image_url?: string;
  destination_url?: string;
  contact_url?: string;
  position_on_page?: 'top' | 'middle' | 'bottom';
  display_order?: number;
  status?: 'active' | 'inactive';
  show_content?: boolean;
  course_ids?: string[];
}

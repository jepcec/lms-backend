export type SliderType = 'courses' | 'banner';
export type SliderPosition = 'top' | 'middle' | 'bottom';
export type SliderStatus = 'active' | 'inactive';

export class SliderEntity {
  id: string;
  title: string;
  subtitle?: string | null;
  type: SliderType;
  image_url?: string | null;
  image_public_id?: string | null;
  destination_url?: string | null;
  contact_url?: string | null;
  position_on_page: SliderPosition;
  display_order: number;
  status: SliderStatus;
  courses?: any[];
  created_at: Date;

  constructor(partial: Partial<SliderEntity>) {
    Object.assign(this, partial);
  }
}

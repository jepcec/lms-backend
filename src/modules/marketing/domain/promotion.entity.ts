export type PromotionStatus = 'active' | 'inactive';

export class PromotionEntity {
  id: string;
  title: string;
  image_url: string;
  destination_url?: string | null;
  destination_course_id?: string | null;
  display_order: number;
  status: PromotionStatus;
  starts_at?: Date | null;
  ends_at?: Date | null;
  created_at: Date;

  constructor(partial: Partial<PromotionEntity>) {
    Object.assign(this, partial);
  }
}

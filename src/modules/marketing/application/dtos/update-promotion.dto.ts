import type { Express } from 'express';

export class UpdatePromotionDto {
  title?: string;
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  destination_url?: string;
  destination_course_id?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
  starts_at?: string;
  ends_at?: string;
}

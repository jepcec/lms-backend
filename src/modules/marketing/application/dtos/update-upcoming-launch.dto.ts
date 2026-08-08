import type { Express } from 'express';

export class UpdateUpcomingLaunchDto {
  category_label?: string;
  title?: string;
  start_date?: string;
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  link_url?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}

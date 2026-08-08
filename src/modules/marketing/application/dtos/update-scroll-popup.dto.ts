import type { Express } from 'express';

export class UpdateScrollPopupDto {
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  destination_url?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}

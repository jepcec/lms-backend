import type { Express } from 'express';

export class CreateAllianceDto {
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}

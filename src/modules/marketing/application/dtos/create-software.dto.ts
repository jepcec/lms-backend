import type { Express } from 'express';

export class CreateSoftwareDto {
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  name: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}

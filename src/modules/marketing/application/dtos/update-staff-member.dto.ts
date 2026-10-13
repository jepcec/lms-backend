import type { Express } from 'express';

export class UpdateStaffMemberDto {
  full_name?: string;      
  title?: string;          
  description?: string;    
  image?: Express.Multer.File;
  image_url?: string;
  image_public_id?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}

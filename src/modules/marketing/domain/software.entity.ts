export type SoftwareStatus = 'active' | 'inactive';

export class SoftwareEntity {
  id: string;
  name: string;
  image_url: string;
  image_public_id?: string | null;
  display_order: number;
  status: SoftwareStatus;
  created_at: Date;

  constructor(partial: Partial<SoftwareEntity>) {
    Object.assign(this, partial);
  }
}

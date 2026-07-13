export type AllianceStatus = 'active' | 'inactive';

export class AllianceEntity {
  id: string;
  image_url: string;
  image_public_id?: string | null;
  display_order: number;
  status: AllianceStatus;
  created_at: Date;

  constructor(partial: Partial<AllianceEntity>) {
    Object.assign(this, partial);
  }
}

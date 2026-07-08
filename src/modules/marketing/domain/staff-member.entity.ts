export type StaffMemberStatus = 'active' | 'inactive';

export class StaffMemberEntity {
  id: string;
  image_url: string;
  image_public_id?: string | null;
  display_order: number;
  status: StaffMemberStatus;
  created_at: Date;

  constructor(partial: Partial<StaffMemberEntity>) {
    Object.assign(this, partial);
  }
}

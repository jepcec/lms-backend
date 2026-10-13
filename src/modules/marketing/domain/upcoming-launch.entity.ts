export type UpcomingLaunchStatus = 'active' | 'inactive';

export class UpcomingLaunchEntity {
  id: string;
  category_label: string;
  title: string;
  start_date: Date;
  image_url?: string | null;
  image_public_id?: string | null;
  link_url?: string | null;
  display_order: number;
  status: UpcomingLaunchStatus;
  created_at: Date;

  constructor(partial: Partial<UpcomingLaunchEntity>) {
    Object.assign(this, partial);
  }
}

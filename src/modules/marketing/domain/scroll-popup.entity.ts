export type ScrollPopupStatus = 'active' | 'inactive';

export class ScrollPopupEntity {
  id: string;
  image_url: string;
  image_public_id?: string | null;
  destination_url?: string | null;
  display_order: number;
  status: ScrollPopupStatus;
  created_at: Date;

  constructor(partial: Partial<ScrollPopupEntity>) {
    Object.assign(this, partial);
  }
}

export class EventTypeEntity {
  id: string;
  name: string;
  display_order: number;
  created_at: Date;

  constructor(partial: Partial<EventTypeEntity>) {
    Object.assign(this, partial);
  }
}

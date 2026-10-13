import { EventTypeEntity } from './event-type.entity';

export interface IEventTypeRepository {
  findAll(): Promise<EventTypeEntity[]>;
  findById(id: string): Promise<EventTypeEntity | null>;
  create(data: Partial<EventTypeEntity>): Promise<EventTypeEntity>;
  update(id: string, data: Partial<EventTypeEntity>): Promise<EventTypeEntity>;
  delete(id: string): Promise<void>;
}

export const I_EVENT_TYPE_REPOSITORY = Symbol('IEventTypeRepository');

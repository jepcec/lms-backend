import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_EVENT_TYPE_REPOSITORY,
  type IEventTypeRepository,
} from '../../domain/event-types.repository';

@Injectable()
export class DeleteEventTypeUseCase {
  constructor(
    @Inject(I_EVENT_TYPE_REPOSITORY)
    private readonly repo: IEventTypeRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`EventType ${id} not found`);
    return this.repo.delete(id);
  }
}

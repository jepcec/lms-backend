import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_EVENT_TYPE_REPOSITORY,
  type IEventTypeRepository,
} from '../../domain/event-types.repository';
import { UpdateEventTypeDto } from '../dtos/update-event-type.dto';

@Injectable()
export class UpdateEventTypeUseCase {
  constructor(
    @Inject(I_EVENT_TYPE_REPOSITORY)
    private readonly repo: IEventTypeRepository,
  ) {}

  async execute(id: string, dto: UpdateEventTypeDto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`EventType ${id} not found`);
    return this.repo.update(id, dto);
  }
}

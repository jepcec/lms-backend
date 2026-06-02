import { Inject, Injectable } from '@nestjs/common';
import {
  I_EVENT_TYPE_REPOSITORY,
  type IEventTypeRepository,
} from '../../domain/event-types.repository';
import { CreateEventTypeDto } from '../dtos/create-event-type.dto';

@Injectable()
export class CreateEventTypeUseCase {
  constructor(
    @Inject(I_EVENT_TYPE_REPOSITORY)
    private readonly repo: IEventTypeRepository,
  ) {}

  execute(dto: CreateEventTypeDto) {
    return this.repo.create(dto);
  }
}

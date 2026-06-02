import { Inject, Injectable } from '@nestjs/common';
import {
  I_EVENT_TYPE_REPOSITORY,
  type IEventTypeRepository,
} from '../../domain/event-types.repository';

@Injectable()
export class GetEventTypesUseCase {
  constructor(
    @Inject(I_EVENT_TYPE_REPOSITORY)
    private readonly repo: IEventTypeRepository,
  ) {}

  execute() {
    return this.repo.findAll();
  }
}

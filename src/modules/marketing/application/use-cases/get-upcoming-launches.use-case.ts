import { Inject, Injectable } from '@nestjs/common';
import {
  I_UPCOMING_LAUNCH_REPOSITORY,
  type IUpcomingLaunchRepository,
} from '../../domain/upcoming-launches.repository';

@Injectable()
export class GetUpcomingLaunchesUseCase {
  constructor(
    @Inject(I_UPCOMING_LAUNCH_REPOSITORY)
    private readonly launchRepository: IUpcomingLaunchRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.launchRepository.findAll(onlyVigentes);
  }
}

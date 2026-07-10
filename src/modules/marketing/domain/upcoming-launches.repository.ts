import { UpcomingLaunchEntity } from './upcoming-launch.entity';

export interface IUpcomingLaunchRepository {
  findAll(onlyVigentes?: boolean): Promise<UpcomingLaunchEntity[]>;
  findById(id: string): Promise<UpcomingLaunchEntity | null>;
  create(launch: Partial<UpcomingLaunchEntity>): Promise<UpcomingLaunchEntity>;
  update(
    id: string,
    launch: Partial<UpcomingLaunchEntity>,
  ): Promise<UpcomingLaunchEntity>;
  delete(id: string): Promise<void>;
}

export const I_UPCOMING_LAUNCH_REPOSITORY = Symbol('IUpcomingLaunchRepository');

import { Inject, Injectable } from '@nestjs/common';
import {
  I_UPCOMING_LAUNCH_REPOSITORY,
  type IUpcomingLaunchRepository,
} from '../../domain/upcoming-launches.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteUpcomingLaunchUseCase {
  constructor(
    @Inject(I_UPCOMING_LAUNCH_REPOSITORY)
    private readonly launchRepository: IUpcomingLaunchRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const launch = await this.launchRepository.findById(id);
    if (launch?.image_public_id) {
      await this.fileStorageService.delete(launch.image_public_id);
    }
    await this.launchRepository.delete(id);
  }
}

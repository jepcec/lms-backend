import { Inject, Injectable } from '@nestjs/common';
import {
  I_SOFTWARE_REPOSITORY,
  type ISoftwareRepository,
} from '../../domain/softwares.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteSoftwareUseCase {
  constructor(
    @Inject(I_SOFTWARE_REPOSITORY)
    private readonly softwareRepository: ISoftwareRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const software = await this.softwareRepository.findById(id);
    if (software?.image_public_id) {
      await this.fileStorageService.delete(software.image_public_id);
    }
    await this.softwareRepository.delete(id);
  }
}

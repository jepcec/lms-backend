import { Inject, Injectable } from '@nestjs/common';
import {
  I_ALLIANCE_REPOSITORY,
  type IAllianceRepository,
} from '../../domain/alliances.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteAllianceUseCase {
  constructor(
    @Inject(I_ALLIANCE_REPOSITORY)
    private readonly allianceRepository: IAllianceRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const alliance = await this.allianceRepository.findById(id);
    if (alliance?.image_public_id) {
      await this.fileStorageService.delete(alliance.image_public_id);
    }
    await this.allianceRepository.delete(id);
  }
}

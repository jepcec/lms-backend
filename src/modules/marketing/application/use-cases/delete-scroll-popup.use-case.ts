import { Inject, Injectable } from '@nestjs/common';
import {
  I_SCROLL_POPUP_REPOSITORY,
  type IScrollPopupRepository,
} from '../../domain/scroll-popups.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeleteScrollPopupUseCase {
  constructor(
    @Inject(I_SCROLL_POPUP_REPOSITORY)
    private readonly popupRepository: IScrollPopupRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const popup = await this.popupRepository.findById(id);
    if (popup?.image_public_id) {
      await this.fileStorageService.delete(popup.image_public_id);
    }
    await this.popupRepository.delete(id);
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_SCROLL_POPUP_REPOSITORY,
  type IScrollPopupRepository,
} from '../../domain/scroll-popups.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { UpdateScrollPopupDto } from '../dtos/update-scroll-popup.dto';

@Injectable()
export class UpdateScrollPopupUseCase {
  constructor(
    @Inject(I_SCROLL_POPUP_REPOSITORY)
    private readonly popupRepository: IScrollPopupRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateScrollPopupDto) {
    const popup = await this.popupRepository.findById(id);
    if (!popup) throw new NotFoundException('Popup no encontrado');

    let imageUrl = dto.image_url ?? popup.image_url;
    let imagePublicId = dto.image_public_id ?? popup.image_public_id;
    const previousPublicId = popup.image_public_id;

    if (dto.image) {
      if (previousPublicId) {
        await this.fileStorageService.delete(previousPublicId);
      }
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'scroll-popups',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    return this.popupRepository.update(id, {
      image_url: imageUrl,
      image_public_id: imagePublicId,
      destination_url: dto.destination_url,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}

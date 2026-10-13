import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_SCROLL_POPUP_REPOSITORY,
  type IScrollPopupRepository,
} from '../../domain/scroll-popups.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { replaceStoredImage } from '../../../storage/domain/replace-stored-image';
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

    const imageUrl = dto.image_url ?? popup.image_url;
    const imagePublicId = dto.image_public_id ?? popup.image_public_id;
    const previousPublicId = popup.image_public_id;

    if (dto.image) {
      return replaceStoredImage(
        this.fileStorageService,
        {
          buffer: dto.image.buffer,
          originalName: dto.image.originalname,
          mimetype: dto.image.mimetype,
          folder: 'scroll-popups',
        },
        previousPublicId,
        (imageUrl, imagePublicId) =>
          this.popupRepository.update(id, {
            image_url: imageUrl,
            image_public_id: imagePublicId,
            destination_url: dto.destination_url,
            display_order: dto.display_order,
            status: dto.status,
          }),
        { format: 'webp' },
      );
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

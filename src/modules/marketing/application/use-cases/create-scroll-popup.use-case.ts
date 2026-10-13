import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  I_SCROLL_POPUP_REPOSITORY,
  type IScrollPopupRepository,
} from '../../domain/scroll-popups.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreateScrollPopupDto } from '../dtos/create-scroll-popup.dto';

@Injectable()
export class CreateScrollPopupUseCase {
  constructor(
    @Inject(I_SCROLL_POPUP_REPOSITORY)
    private readonly popupRepository: IScrollPopupRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateScrollPopupDto) {
    if (!dto.image && !dto.image_url) {
      throw new BadRequestException('Se requiere una imagen');
    }

    let imageUrl = dto.image_url;
    let imagePublicId = dto.image_public_id;

    if (dto.image) {
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

    return this.popupRepository.create({
      image_url: imageUrl,
      image_public_id: imagePublicId,
      destination_url: dto.destination_url,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}

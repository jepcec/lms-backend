import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_PROMOTION_REPOSITORY,
  type IPromotionRepository,
} from '../../domain/promotions.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { UpdatePromotionDto } from '../dtos/update-promotion.dto';

@Injectable()
export class UpdatePromotionUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdatePromotionDto) {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) throw new NotFoundException('Promotion not found');

    let imageUrl = dto.image_url ?? promotion.image_url;
    const previousImageUrl = promotion.image_url;

    if (dto.image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'promotions',
      });
      imageUrl = result.url;
    }

    const updated = await this.promotionRepository.update(id, {
      title: dto.title,
      image_url: imageUrl,
      destination_url: dto.destination_url,
      destination_course_id: dto.destination_course_id,
      display_order: dto.display_order,
      status: dto.status,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
    });

    if (dto.image && previousImageUrl) {
      const publicId = previousImageUrl.replace('/uploads/', '');
      await this.fileStorageService.delete(publicId);
    }

    return updated;
  }
}

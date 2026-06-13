import { Inject, Injectable } from '@nestjs/common';
import {
  I_PROMOTION_REPOSITORY,
  type IPromotionRepository,
} from '../../domain/promotions.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreatePromotionDto } from '../dtos/create-promotion.dto';

@Injectable()
export class CreatePromotionUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreatePromotionDto) {
    let imageUrl = dto.image_url;
    let imagePublicId = dto.image_public_id;

    if (dto.image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'promotions',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    return this.promotionRepository.create({
      title: dto.title,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      destination_url: dto.destination_url,
      destination_course_id: dto.destination_course_id,
      display_order: dto.display_order,
      status: dto.status,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
    });
  }
}

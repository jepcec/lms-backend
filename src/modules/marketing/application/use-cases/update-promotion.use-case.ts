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
    let imagePublicId = dto.image_public_id ?? promotion.image_public_id;
    const previousPublicId = promotion.image_public_id;

    if (dto.image) {
      if (previousPublicId) {
        await this.fileStorageService.delete(previousPublicId);
      }
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'promotions',
      });
      imageUrl = result.secureUrl;
      imagePublicId = result.publicId;
    }

    return this.promotionRepository.update(id, {
      title: dto.title,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      destination_url: dto.destination_url,
      destination_course_id: dto.destination_course_id,
      display_order: dto.display_order,
      status: dto.status,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
    } as any);
  }
}

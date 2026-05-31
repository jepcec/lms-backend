import { Inject, Injectable } from '@nestjs/common';
import {
  I_PROMOTION_REPOSITORY,
  type IPromotionRepository,
} from '../../domain/promotions.repository';
import { I_FILE_STORAGE_SERVICE, type IFileStorageService } from '../../../storage/domain/file-storage.interface';

@Injectable()
export class DeletePromotionUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);
    if (promotion?.image_public_id) {
      await this.fileStorageService.delete(promotion.image_public_id);
    }
    await this.promotionRepository.delete(id);
  }
}

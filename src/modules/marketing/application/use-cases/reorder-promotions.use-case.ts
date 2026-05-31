import { Inject, Injectable } from '@nestjs/common';
import {
  I_PROMOTION_REPOSITORY,
  type IPromotionRepository,
} from '../../domain/promotions.repository';
import { ReorderPromotionsDto } from '../dtos/reorder-promotions.dto';

@Injectable()
export class ReorderPromotionsUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async execute(dto: ReorderPromotionsDto): Promise<void> {
    await this.promotionRepository.reorder(dto.ids);
  }
}

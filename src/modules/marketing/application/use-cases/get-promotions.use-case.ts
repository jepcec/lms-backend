import { Inject, Injectable } from '@nestjs/common';
import {
  I_PROMOTION_REPOSITORY,
  type IPromotionRepository,
} from '../../domain/promotions.repository';

@Injectable()
export class GetPromotionsUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async execute(onlyVigentes?: boolean) {
    return this.promotionRepository.findAll(onlyVigentes);
  }
}

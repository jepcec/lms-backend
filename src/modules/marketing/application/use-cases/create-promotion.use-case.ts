import { Inject, Injectable } from '@nestjs/common';
import { I_PROMOTION_REPOSITORY, type IPromotionRepository } from '../../domain/promotions.repository';
import { CreatePromotionDto } from '../dtos/create-promotion.dto';

@Injectable()
export class CreatePromotionUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async execute(dto: CreatePromotionDto) {
    return this.promotionRepository.create({
      ...dto,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
    } as any);
  }
}

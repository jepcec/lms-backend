import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { I_PROMOTION_REPOSITORY, type  IPromotionRepository } from '../../domain/promotions.repository';
import { UpdatePromotionDto } from '../dtos/update-promotion.dto';

@Injectable()
export class UpdatePromotionUseCase {
  constructor(
    @Inject(I_PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async execute(id: string, dto: UpdatePromotionDto) {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) throw new NotFoundException('Promotion not found');

    return this.promotionRepository.update(id, {
      ...dto,
      starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
      ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
    } as any);
  }
}

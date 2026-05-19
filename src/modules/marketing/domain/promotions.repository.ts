import { PromotionEntity } from './promotion.entity';

export interface IPromotionRepository {
  findAll(): Promise<PromotionEntity[]>;
  findById(id: string): Promise<PromotionEntity | null>;
  create(promotion: Partial<PromotionEntity>): Promise<PromotionEntity>;
  update(id: string, promotion: Partial<PromotionEntity>): Promise<PromotionEntity>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
}

export const I_PROMOTION_REPOSITORY = Symbol('IPromotionRepository');

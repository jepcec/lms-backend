import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePromotionUseCase } from './application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from './application/use-cases/delete-promotion.use-case';
import { GetPromotionsUseCase } from './application/use-cases/get-promotions.use-case';
import { ReorderPromotionsUseCase } from './application/use-cases/reorder-promotions.use-case';
import { UpdatePromotionUseCase } from './application/use-cases/update-promotion.use-case';
import { CreateSliderUseCase } from './application/use-cases/create-slider.use-case';
import { DeleteSliderUseCase } from './application/use-cases/delete-slider.use-case';
import { GetSlidersUseCase } from './application/use-cases/get-sliders.use-case';
import { UpdateSliderUseCase } from './application/use-cases/update-slider.use-case';
import { I_PROMOTION_REPOSITORY } from './domain/promotions.repository';
import { I_SLIDER_REPOSITORY } from './domain/sliders.repository';
import { PrismaPromotionRepository } from './infrastructure/database/prisma-promotions.repository';
import { PrismaSliderRepository } from './infrastructure/database/prisma-sliders.repository';
import { PromotionsController } from './infrastructure/routes/promotions.controller';
import { SlidersController } from './infrastructure/routes/sliders.controller';

@Module({
  controllers: [PromotionsController, SlidersController],
  providers: [
    PrismaService,
    // Promotions Use Cases
    CreatePromotionUseCase,
    GetPromotionsUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    ReorderPromotionsUseCase,
    // Sliders Use Cases
    CreateSliderUseCase,
    GetSlidersUseCase,
    UpdateSliderUseCase,
    DeleteSliderUseCase,
    // Repositories
    {
      provide: I_PROMOTION_REPOSITORY,
      useClass: PrismaPromotionRepository,
    },
    {
      provide: I_SLIDER_REPOSITORY,
      useClass: PrismaSliderRepository,
    },
  ],
})
export class MarketingModule {}

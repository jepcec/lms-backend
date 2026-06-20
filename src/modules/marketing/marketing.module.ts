import { Module } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { CreatePromotionUseCase } from './application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from './application/use-cases/delete-promotion.use-case';
import { GetPromotionsUseCase } from './application/use-cases/get-promotions.use-case';
import { ReorderPromotionsUseCase } from './application/use-cases/reorder-promotions.use-case';
import { UpdatePromotionUseCase } from './application/use-cases/update-promotion.use-case';
import { CreateSliderUseCase } from './application/use-cases/create-slider.use-case';
import { DeleteSliderUseCase } from './application/use-cases/delete-slider.use-case';
import { GetSlidersUseCase } from './application/use-cases/get-sliders.use-case';
import { UpdateSliderUseCase } from './application/use-cases/update-slider.use-case';
import { UploadSliderImageUseCase } from './application/use-cases/upload-slider-image.use-case';
import { CreateEventTypeUseCase } from './application/use-cases/create-event-type.use-case';
import { DeleteEventTypeUseCase } from './application/use-cases/delete-event-type.use-case';
import { GetEventTypesUseCase } from './application/use-cases/get-event-types.use-case';
import { UpdateEventTypeUseCase } from './application/use-cases/update-event-type.use-case';
import { I_PROMOTION_REPOSITORY } from './domain/promotions.repository';
import { I_SLIDER_REPOSITORY } from './domain/sliders.repository';
import { I_EVENT_TYPE_REPOSITORY } from './domain/event-types.repository';
import { PrismaPromotionRepository } from './infrastructure/database/prisma-promotions.repository';
import { PrismaSliderRepository } from './infrastructure/database/prisma-sliders.repository';
import { PrismaEventTypeRepository } from './infrastructure/database/prisma-event-types.repository';
import { PromotionsController } from './infrastructure/routes/promotions.controller';
import { SlidersController } from './infrastructure/routes/sliders.controller';
import { EventTypesController } from './infrastructure/routes/event-types.controller';

@Module({
  imports: [StorageModule],
  controllers: [PromotionsController, SlidersController, EventTypesController],
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
    UploadSliderImageUseCase,
    // EventTypes Use Cases
    GetEventTypesUseCase,
    CreateEventTypeUseCase,
    UpdateEventTypeUseCase,
    DeleteEventTypeUseCase,
    // Repositories
    {
      provide: I_PROMOTION_REPOSITORY,
      useClass: PrismaPromotionRepository,
    },
    {
      provide: I_SLIDER_REPOSITORY,
      useClass: PrismaSliderRepository,
    },
    {
      provide: I_EVENT_TYPE_REPOSITORY,
      useClass: PrismaEventTypeRepository,
    },
  ],
})
export class MarketingModule {}

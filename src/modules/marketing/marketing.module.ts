import { Module } from '@nestjs/common';
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
import { CreateUpcomingLaunchUseCase } from './application/use-cases/create-upcoming-launch.use-case';
import { GetUpcomingLaunchesUseCase } from './application/use-cases/get-upcoming-launches.use-case';
import { UpdateUpcomingLaunchUseCase } from './application/use-cases/update-upcoming-launch.use-case';
import { DeleteUpcomingLaunchUseCase } from './application/use-cases/delete-upcoming-launch.use-case';
import { CreateStaffMemberUseCase } from './application/use-cases/create-staff-member.use-case';
import { GetStaffMembersUseCase } from './application/use-cases/get-staff-members.use-case';
import { UpdateStaffMemberUseCase } from './application/use-cases/update-staff-member.use-case';
import { DeleteStaffMemberUseCase } from './application/use-cases/delete-staff-member.use-case';
import { CreateSoftwareUseCase } from './application/use-cases/create-software.use-case';
import { GetSoftwaresUseCase } from './application/use-cases/get-softwares.use-case';
import { UpdateSoftwareUseCase } from './application/use-cases/update-software.use-case';
import { DeleteSoftwareUseCase } from './application/use-cases/delete-software.use-case';
import { CreateScrollPopupUseCase } from './application/use-cases/create-scroll-popup.use-case';
import { GetScrollPopupsUseCase } from './application/use-cases/get-scroll-popups.use-case';
import { UpdateScrollPopupUseCase } from './application/use-cases/update-scroll-popup.use-case';
import { DeleteScrollPopupUseCase } from './application/use-cases/delete-scroll-popup.use-case';
import { CreateAllianceUseCase } from './application/use-cases/create-alliance.use-case';
import { GetAlliancesUseCase } from './application/use-cases/get-alliances.use-case';
import { UpdateAllianceUseCase } from './application/use-cases/update-alliance.use-case';
import { DeleteAllianceUseCase } from './application/use-cases/delete-alliance.use-case';
import { I_PROMOTION_REPOSITORY } from './domain/promotions.repository';
import { I_SLIDER_REPOSITORY } from './domain/sliders.repository';
import { I_EVENT_TYPE_REPOSITORY } from './domain/event-types.repository';
import { I_UPCOMING_LAUNCH_REPOSITORY } from './domain/upcoming-launches.repository';
import { I_STAFF_MEMBER_REPOSITORY } from './domain/staff-members.repository';
import { I_SOFTWARE_REPOSITORY } from './domain/softwares.repository';
import { I_SCROLL_POPUP_REPOSITORY } from './domain/scroll-popups.repository';
import { I_ALLIANCE_REPOSITORY } from './domain/alliances.repository';
import { PrismaPromotionRepository } from './infrastructure/database/prisma-promotions.repository';
import { PrismaSliderRepository } from './infrastructure/database/prisma-sliders.repository';
import { PrismaEventTypeRepository } from './infrastructure/database/prisma-event-types.repository';
import { PrismaUpcomingLaunchRepository } from './infrastructure/database/prisma-upcoming-launches.repository';
import { PrismaStaffMemberRepository } from './infrastructure/database/prisma-staff-members.repository';
import { PrismaSoftwareRepository } from './infrastructure/database/prisma-softwares.repository';
import { PrismaScrollPopupRepository } from './infrastructure/database/prisma-scroll-popups.repository';
import { PrismaAllianceRepository } from './infrastructure/database/prisma-alliances.repository';
import { PromotionsController } from './infrastructure/routes/promotions.controller';
import { SlidersController } from './infrastructure/routes/sliders.controller';
import { EventTypesController } from './infrastructure/routes/event-types.controller';
import { UpcomingLaunchesController } from './infrastructure/routes/upcoming-launches.controller';
import { StaffMembersController } from './infrastructure/routes/staff-members.controller';
import { SoftwaresController } from './infrastructure/routes/softwares.controller';
import { ScrollPopupsController } from './infrastructure/routes/scroll-popups.controller';
import { AlliancesController } from './infrastructure/routes/alliances.controller';

@Module({
  imports: [StorageModule],
  controllers: [
    PromotionsController,
    SlidersController,
    EventTypesController,
    UpcomingLaunchesController,
    StaffMembersController,
    SoftwaresController,
    ScrollPopupsController,
    AlliancesController,
  ],
  providers: [
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
    // UpcomingLaunches Use Cases
    CreateUpcomingLaunchUseCase,
    GetUpcomingLaunchesUseCase,
    UpdateUpcomingLaunchUseCase,
    DeleteUpcomingLaunchUseCase,
    // StaffMembers Use Cases
    CreateStaffMemberUseCase,
    GetStaffMembersUseCase,
    UpdateStaffMemberUseCase,
    DeleteStaffMemberUseCase,
    // Software Use Cases
    CreateSoftwareUseCase,
    GetSoftwaresUseCase,
    UpdateSoftwareUseCase,
    DeleteSoftwareUseCase,
    // ScrollPopup Use Cases
    CreateScrollPopupUseCase,
    GetScrollPopupsUseCase,
    UpdateScrollPopupUseCase,
    DeleteScrollPopupUseCase,
    // Alliance Use Cases
    CreateAllianceUseCase,
    GetAlliancesUseCase,
    UpdateAllianceUseCase,
    DeleteAllianceUseCase,
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
    {
      provide: I_UPCOMING_LAUNCH_REPOSITORY,
      useClass: PrismaUpcomingLaunchRepository,
    },
    {
      provide: I_STAFF_MEMBER_REPOSITORY,
      useClass: PrismaStaffMemberRepository,
    },
    {
      provide: I_SOFTWARE_REPOSITORY,
      useClass: PrismaSoftwareRepository,
    },
    {
      provide: I_SCROLL_POPUP_REPOSITORY,
      useClass: PrismaScrollPopupRepository,
    },
    {
      provide: I_ALLIANCE_REPOSITORY,
      useClass: PrismaAllianceRepository,
    },
  ],
})
export class MarketingModule {}

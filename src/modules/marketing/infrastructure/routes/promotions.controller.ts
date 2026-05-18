import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePromotionDto } from '../../application/dtos/create-promotion.dto';
import { ReorderPromotionsDto } from '../../application/dtos/reorder-promotions.dto';
import { UpdatePromotionDto } from '../../application/dtos/update-promotion.dto';
import { CreatePromotionUseCase } from '../../application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from '../../application/use-cases/delete-promotion.use-case';
import { GetPromotionsUseCase } from '../../application/use-cases/get-promotions.use-case';
import { ReorderPromotionsUseCase } from '../../application/use-cases/reorder-promotions.use-case';
import { UpdatePromotionUseCase } from '../../application/use-cases/update-promotion.use-case';

@Controller('promociones')
export class PromotionsController {
  constructor(
    private readonly createPromotionUseCase: CreatePromotionUseCase,
    private readonly getPromotionsUseCase: GetPromotionsUseCase,
    private readonly updatePromotionUseCase: UpdatePromotionUseCase,
    private readonly deletePromotionUseCase: DeletePromotionUseCase,
    private readonly reorderPromotionsUseCase: ReorderPromotionsUseCase,
  ) {}

  @Get()
  findAll() {
    return this.getPromotionsUseCase.execute();
  }

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.createPromotionUseCase.execute(dto);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderPromotionsDto) {
    return this.reorderPromotionsUseCase.execute(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.updatePromotionUseCase.execute(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deletePromotionUseCase.execute(id);
  }
}

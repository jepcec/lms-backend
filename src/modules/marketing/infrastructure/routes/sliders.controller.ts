import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateSliderDto } from '../../application/dtos/create-slider.dto';
import { UpdateSliderDto } from '../../application/dtos/update-slider.dto';
import { CreateSliderUseCase } from '../../application/use-cases/create-slider.use-case';
import { DeleteSliderUseCase } from '../../application/use-cases/delete-slider.use-case';
import { GetSlidersUseCase } from '../../application/use-cases/get-sliders.use-case';
import { UpdateSliderUseCase } from '../../application/use-cases/update-slider.use-case';

@Controller('sliders')
export class SlidersController {
  constructor(
    private readonly createSliderUseCase: CreateSliderUseCase,
    private readonly getSlidersUseCase: GetSlidersUseCase,
    private readonly updateSliderUseCase: UpdateSliderUseCase,
    private readonly deleteSliderUseCase: DeleteSliderUseCase,
  ) {}

  @Get()
  findAll() {
    return this.getSlidersUseCase.execute();
  }

  @Post()
  create(@Body() dto: CreateSliderDto) {
    return this.createSliderUseCase.execute(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSliderDto) {
    return this.updateSliderUseCase.execute(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteSliderUseCase.execute(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Express } from 'express';
import { imageUploadInterceptor } from 'src/modules/storage/infrastructure/upload/image-upload.interceptor';
import { CreateSliderDto } from '../../application/dtos/create-slider.dto';
import { UpdateSliderDto } from '../../application/dtos/update-slider.dto';
import { CreateSliderUseCase } from '../../application/use-cases/create-slider.use-case';
import { DeleteSliderUseCase } from '../../application/use-cases/delete-slider.use-case';
import { GetSlidersUseCase } from '../../application/use-cases/get-sliders.use-case';
import { UpdateSliderUseCase } from '../../application/use-cases/update-slider.use-case';
import { UploadSliderImageUseCase } from '../../application/use-cases/upload-slider-image.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('sliders')
export class SlidersController {
  constructor(
    private readonly createSliderUseCase: CreateSliderUseCase,
    private readonly getSlidersUseCase: GetSlidersUseCase,
    private readonly updateSliderUseCase: UpdateSliderUseCase,
    private readonly deleteSliderUseCase: DeleteSliderUseCase,
    private readonly uploadSliderImageUseCase: UploadSliderImageUseCase,
  ) {}

  @Public()
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

  @Post(':id/image')
  @Roles('admin')
  @UseInterceptors(imageUploadInterceptor('image'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadSliderImageUseCase.execute(id, file);
  }
}

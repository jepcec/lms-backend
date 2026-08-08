import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Express } from 'express';
import { imageUploadInterceptor } from 'src/modules/storage/infrastructure/upload/image-upload.interceptor';
import { CreateUpcomingLaunchDto } from '../../application/dtos/create-upcoming-launch.dto';
import { UpdateUpcomingLaunchDto } from '../../application/dtos/update-upcoming-launch.dto';
import { CreateUpcomingLaunchUseCase } from '../../application/use-cases/create-upcoming-launch.use-case';
import { GetUpcomingLaunchesUseCase } from '../../application/use-cases/get-upcoming-launches.use-case';
import { UpdateUpcomingLaunchUseCase } from '../../application/use-cases/update-upcoming-launch.use-case';
import { DeleteUpcomingLaunchUseCase } from '../../application/use-cases/delete-upcoming-launch.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('lanzamientos')
export class UpcomingLaunchesController {
  constructor(
    private readonly createUseCase: CreateUpcomingLaunchUseCase,
    private readonly getUseCase: GetUpcomingLaunchesUseCase,
    private readonly updateUseCase: UpdateUpcomingLaunchUseCase,
    private readonly deleteUseCase: DeleteUpcomingLaunchUseCase,
  ) {}

  @Public()
  @Get()
  findAll(@Query('vigente') vigente?: string) {
    return this.getUseCase.execute(vigente === 'true');
  }

  @Post()
  @Roles('admin', 'marketing')
  @UseInterceptors(imageUploadInterceptor('image'))
  create(
    @Body() dto: CreateUpcomingLaunchDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) dto.image = image;
    return this.createUseCase.execute(dto);
  }

  @Patch(':id')
  @Roles('admin', 'marketing')
  @UseInterceptors(imageUploadInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUpcomingLaunchDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) dto.image = image;
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'marketing')
  remove(@Param('id') id: string) {
    return this.deleteUseCase.execute(id);
  }
}

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
import { CreateSoftwareDto } from '../../application/dtos/create-software.dto';
import { UpdateSoftwareDto } from '../../application/dtos/update-software.dto';
import { CreateSoftwareUseCase } from '../../application/use-cases/create-software.use-case';
import { GetSoftwaresUseCase } from '../../application/use-cases/get-softwares.use-case';
import { UpdateSoftwareUseCase } from '../../application/use-cases/update-software.use-case';
import { DeleteSoftwareUseCase } from '../../application/use-cases/delete-software.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('softwares')
export class SoftwaresController {
  constructor(
    private readonly createUseCase: CreateSoftwareUseCase,
    private readonly getUseCase: GetSoftwaresUseCase,
    private readonly updateUseCase: UpdateSoftwareUseCase,
    private readonly deleteUseCase: DeleteSoftwareUseCase,
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
    @Body() dto: CreateSoftwareDto,
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
    @Body() dto: UpdateSoftwareDto,
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

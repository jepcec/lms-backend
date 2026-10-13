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
import { CreateAllianceDto } from '../../application/dtos/create-alliance.dto';
import { UpdateAllianceDto } from '../../application/dtos/update-alliance.dto';
import { CreateAllianceUseCase } from '../../application/use-cases/create-alliance.use-case';
import { GetAlliancesUseCase } from '../../application/use-cases/get-alliances.use-case';
import { UpdateAllianceUseCase } from '../../application/use-cases/update-alliance.use-case';
import { DeleteAllianceUseCase } from '../../application/use-cases/delete-alliance.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('alianzas')
export class AlliancesController {
  constructor(
    private readonly createUseCase: CreateAllianceUseCase,
    private readonly getUseCase: GetAlliancesUseCase,
    private readonly updateUseCase: UpdateAllianceUseCase,
    private readonly deleteUseCase: DeleteAllianceUseCase,
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
    @Body() dto: CreateAllianceDto,
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
    @Body() dto: UpdateAllianceDto,
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

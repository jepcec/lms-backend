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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express, Request } from 'express';
import type { FileFilterCallback } from 'multer';
import { CreateScrollPopupDto } from '../../application/dtos/create-scroll-popup.dto';
import { UpdateScrollPopupDto } from '../../application/dtos/update-scroll-popup.dto';
import { CreateScrollPopupUseCase } from '../../application/use-cases/create-scroll-popup.use-case';
import { GetScrollPopupsUseCase } from '../../application/use-cases/get-scroll-popups.use-case';
import { UpdateScrollPopupUseCase } from '../../application/use-cases/update-scroll-popup.use-case';
import { DeleteScrollPopupUseCase } from '../../application/use-cases/delete-scroll-popup.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(
      new Error('Only image files are allowed (jpg, jpeg, png, webp)'),
    );
  }
  callback(null, true);
};

@Controller('scroll-popups')
export class ScrollPopupsController {
  constructor(
    private readonly createUseCase: CreateScrollPopupUseCase,
    private readonly getUseCase: GetScrollPopupsUseCase,
    private readonly updateUseCase: UpdateScrollPopupUseCase,
    private readonly deleteUseCase: DeleteScrollPopupUseCase,
  ) {}

  @Public()
  @Get()
  findAll(@Query('vigente') vigente?: string) {
    return this.getUseCase.execute(vigente === 'true');
  }

  @Post()
  @Roles('admin', 'marketing')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateScrollPopupDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image) dto.image = image;
    return this.createUseCase.execute(dto);
  }

  @Patch(':id')
  @Roles('admin', 'marketing')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScrollPopupDto,
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

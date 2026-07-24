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
import { CreateStaffMemberDto } from '../../application/dtos/create-staff-member.dto';
import { UpdateStaffMemberDto } from '../../application/dtos/update-staff-member.dto';
import { CreateStaffMemberUseCase } from '../../application/use-cases/create-staff-member.use-case';
import { GetStaffMembersUseCase } from '../../application/use-cases/get-staff-members.use-case';
import { UpdateStaffMemberUseCase } from '../../application/use-cases/update-staff-member.use-case';
import { DeleteStaffMemberUseCase } from '../../application/use-cases/delete-staff-member.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('docentes')
export class StaffMembersController {
  constructor(
    private readonly createUseCase: CreateStaffMemberUseCase,
    private readonly getUseCase: GetStaffMembersUseCase,
    private readonly updateUseCase: UpdateStaffMemberUseCase,
    private readonly deleteUseCase: DeleteStaffMemberUseCase,
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
    @Body() dto: CreateStaffMemberDto,
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
    @Body() dto: UpdateStaffMemberDto,
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

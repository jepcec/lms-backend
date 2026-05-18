import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { GetProfileUseCase } from "../../application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "../../application/use-cases/update-profile.use-case";
import { UpdateProfileDto } from "../../application/dtos/update-profile.dto";
import { DeleteAccountUseCase } from "../../application/use-cases/delete-user.use-case";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { Multer } from 'multer';
import type { Express } from "express";

import { GetUsuarioUseCase } from "../../application/use-cases/get-usuario.use-case";
import { CreateUsuarioUseCase } from "../../application/use-cases/create-usuario.use-case";
import { UpdateUsuarioUseCase } from "../../application/use-cases/update-usuario.use-case";
import { SuspendUsuarioUseCase } from "../../application/use-cases/suspend-usuario.use-case";
import { ActivateUsuarioUseCase } from "../../application/use-cases/activate-usuario.use-case";
import { CreateUsuarioDto } from "../../application/dtos/create-usuario.dto";
import { UpdateUsuarioDto } from "../../application/dtos/update-usuario.dto";

@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
    private readonly getUsuarioUC: GetUsuarioUseCase,
    private readonly createUsuarioUC: CreateUsuarioUseCase,
    private readonly updateUsuarioUC: UpdateUsuarioUseCase,
    private readonly suspendUsuarioUC: SuspendUsuarioUseCase,
    private readonly activateUsuarioUC: ActivateUsuarioUseCase,
  ) {}

  @Get('profile/:id')
  async get(@Param('id') id: string) {
    return this.getProfile.execute(id);
  }

  @Patch('profile/:id')
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './uploads/profiles',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imagePath = file ? `/uploads/profiles/${file.filename}` : undefined;
    return this.updateProfile.execute(id, dto, imagePath);
  }

  @Delete('profile/:id')
  async delete(@Param('id') id: string) {
    return this.deleteAccount.execute(id);
  }

  @Roles('admin')
  @Get(':id')
  async getUsuario(@Param('id') id: string) {
    return this.getUsuarioUC.execute(id);
  }

  @Roles('admin')
  @Post()
  async createUsuario(@Body() dto: CreateUsuarioDto) {
    return this.createUsuarioUC.execute(dto);
  }

  @Roles('admin')
  @Patch(':id')
  async updateUsuario(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.updateUsuarioUC.execute(id, dto);
  }

  @Roles('admin')
  @Patch(':id/suspender')
  async suspendUsuario(@Param('id') id: string) {
    return this.suspendUsuarioUC.execute(id);
  }

  @Roles('admin')
  @Patch(':id/activar')
  async activateUsuario(@Param('id') id: string) {
    return this.activateUsuarioUC.execute(id);
  }

  @Roles('admin')
  @Delete(':id')
  async deleteUsuario(@Param('id') id: string) {
    return this.deleteAccount.execute(id);
  }
}

// src/modules/users/infrastructure/controllers/users.controller.ts
// INTALACION DE TYPOS DE MULTER
import { Controller, Get, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { GetProfileUseCase } from "../../application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "../../application/use-cases/update-profile.use-case";
import { UpdateProfileDto } from "../../application/dtos/update-profile.dto";
import { DeleteAccountUseCase } from "../../application/use-cases/delete-user.use-case";
import { Multer } from 'multer';
import type { Express } from "express";

@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteAccount: DeleteAccountUseCase, // ✅ Inyectado
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
}

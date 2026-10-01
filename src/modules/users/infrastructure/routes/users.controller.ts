import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ChangePasswordDto } from '../../application/dtos/change-password.dto';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-user.use-case';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { Multer } from 'multer';
import type { Express } from 'express';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';

import { GetUsuarioUseCase } from '../../application/use-cases/get-usuario.use-case';
import { CreateUsuarioUseCase } from '../../application/use-cases/create-usuario.use-case';
import { UpdateUsuarioUseCase } from '../../application/use-cases/update-usuario.use-case';
import { SuspendUsuarioUseCase } from '../../application/use-cases/suspend-usuario.use-case';
import { ActivateUsuarioUseCase } from '../../application/use-cases/activate-usuario.use-case';
import { CreateUsuarioDto } from '../../application/dtos/create-usuario.dto';
import { UpdateUsuarioDto } from '../../application/dtos/update-usuario.dto';
import { BuscarUsuariosUseCase } from '../../application/use-cases/buscar-usuarios.use-case';

import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly changePasswordUC: ChangePasswordUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,

    private readonly getUsuarioUC: GetUsuarioUseCase,
    private readonly createUsuarioUC: CreateUsuarioUseCase,
    private readonly updateUsuarioUC: UpdateUsuarioUseCase,
    private readonly suspendUsuarioUC: SuspendUsuarioUseCase,
    private readonly activateUsuarioUC: ActivateUsuarioUseCase,
    private readonly buscarUsuariosUC: BuscarUsuariosUseCase,

    private readonly prisma: PrismaService,
  ) {}

  @Get('profile/:id')
  async get(@Param('id') id: string) {
    return this.getProfile.execute(id);
  }

  @Patch('profile/:id')
  @UseInterceptors(
    FileInterceptor('photo', {
      // 'photo' coincide con el frontend
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') currentRole: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (id !== currentUserId && currentRole !== 'admin') {
      throw new ForbiddenException(
        'No puedes editar el perfil de otro usuario',
      );
    }

    // Si el archivo se subió con éxito, guardamos su ruta en el DTO
    if (file) {
      dto.profile_photo_url = `/uploads/profiles/${file.filename}`;
    }

    // Le pasamos el DTO ya modificado al caso de uso
    return this.updateProfile.execute(id, dto);
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.changePasswordUC.execute(
      userId,
      dto.current_password,
      dto.new_password,
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  @Roles('admin')
  @Get('buscar')
  async buscarUsuarios(@Query('q') q: string, @Query('role') role?: string) {
    return this.buscarUsuariosUC.execute(q, role);
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
  // 🚀 1. Asignar / Resetear Contraseña (Admin y Soporte)
  @Roles('admin', 'soporte')
  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await this.prisma.user.update({
      where: { id },
      data: {
        password_hash,
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  // 🚀 2. Aprobar / Verificar Correo Manualmente (Admin y Soporte)
  @Roles('admin', 'soporte')
  @Patch(':id/verify-email')
  async verifyEmail(@Param('id') id: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
      },
    });

    return { message: 'Correo verificado y aprobado con éxito' };
  }
  
  @Roles('admin')
  @Delete(':id')
  async deleteUsuario(@Param('id') id: string) {
    return this.deleteAccount.execute(id);
  }
  
}

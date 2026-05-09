// modules/users/application/use-cases/update-profile.use-case.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import * as bcrypt from 'bcrypt'; // Asumiendo que usas bcrypt para los hashes

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updateData: any = {
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone: dto.phone,
      country: dto.country,
      profile_photo_url: dto.profile_photo_url,
    };

    // Lógica para cambio de contraseña [cite: 123, 130]
    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException('Debes proporcionar la contraseña actual');
      }

      const isPasswordValid = await bcrypt.compare(dto.current_password, user.password_hash);
      if (!isPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      updateData.password_hash = await bcrypt.hash(dto.new_password, 10);
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { // No devolvemos el hash por seguridad
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        country: true,
        profile_photo_url: true,
        updated_at: true,
      }
    });
  }
}
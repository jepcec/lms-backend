import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, dto: UpdateProfileDto) {
    // 1. Verificar si el usuario existe
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Construir dinámicamente los datos a actualizar
    const data: Record<string, unknown> = {};

    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.profession !== undefined) data.profession = dto.profession;

    // Aquí se mapea la ruta provisional de la foto local
    if (dto.profile_photo_url !== undefined) {
      data.profile_photo_url = dto.profile_photo_url;
    }

    // 3. Ejecutar actualización
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    // 4. Retornar estructura estándar formateada
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      country: user.country ?? undefined,
      profession: user.profession ?? undefined,
      role: user.role,
      profile_photo_url: user.profile_photo_url ?? undefined,
      email_verified: user.email_verified,
      status: user.status,
      created_by: user.created_by ?? undefined,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }
}

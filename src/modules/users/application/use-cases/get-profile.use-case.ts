// modules/users/application/use-cases/get-profile.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { 
        id: userId,
        deleted_at: null // Solo busca usuarios activos (RF-012/RF-004) [cite: 110, 405]
      },
    });

    if (!user) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Retornamos exactamente la misma estructura limpia y estandarizada que usas en todo el backend
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      country: user.country ?? undefined,
      role: user.role,
      profile_photo_url: user.profile_photo_url ?? undefined, // <-- ¡ESTO ASEGURA QUE LLEGUE AL FRONTEND!
      email_verified: user.email_verified,
      status: user.status,
      created_by: user.created_by ?? undefined,
      created_at: user.created_at.toISOString(), // Convertido a string ISO idéntico a GetUsuario
      updated_at: user.updated_at.toISOString(),
    };
  }
}
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
      deleted_at: null // Solo busca usuarios activos (RF-012/RF-004)
    },
    select: { 
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      country: true,
      profile_photo_url: true,
      role: true,
      status: true,
      created_at: true,
      deleted_at: true // <-- AGREGAR ESTO PARA QUITAR EL ERROR
    }
  });

  if (!user) {
    throw new NotFoundException('Perfil no encontrado');
  }

  return user;
}
}
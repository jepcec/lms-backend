// modules/users/application/use-cases/delete-account.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class DeleteAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        deleted_at: new Date(),
        status: 'deleted', // Usando el enum UserStatus
      },
    });
  }
}

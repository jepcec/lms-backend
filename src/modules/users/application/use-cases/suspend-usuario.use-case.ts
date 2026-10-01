import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

import {
  assertActiveAdmin,
  assertNotLastActiveAdmin,
  assertNotSelf,
  lockAdminTransitions,
} from './admin-safety.util';
@Injectable()
export class SuspendUsuarioUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, currentUserId: string) {
    assertNotSelf(id, currentUserId, 'suspender');
    await this.prisma.$transaction(async (tx) => {
      await lockAdminTransitions(tx);
      await assertActiveAdmin(tx, currentUserId);
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      await assertNotLastActiveAdmin(tx, user);
      await tx.user.update({
        where: { id },
        data: { status: 'suspended', session_version: { increment: 1 } } as any,
      });
    });

    return { message: 'Usuario suspendido exitosamente' };
  }
}

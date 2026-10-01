// modules/users/application/use-cases/delete-account.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

import {
  assertActiveAdmin,
  assertNotLastActiveAdmin,
  assertNotSelf,
  lockAdminTransitions,
} from './admin-safety.util';
@Injectable()
export class DeleteAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, currentUserId: string) {
    assertNotSelf(userId, currentUserId, 'eliminar');
    return this.prisma.$transaction(async (tx) => {
      await lockAdminTransitions(tx);
      await assertActiveAdmin(tx, currentUserId);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Usuario no encontrado');
      await assertNotLastActiveAdmin(tx, user);
      const deleted = await tx.user.update({
        where: { id: userId },
        data: {
          deleted_at: new Date(),
          status: 'deleted',
          session_version: { increment: 1 },
        } as any,
        select: { id: true, status: true, deleted_at: true },
      });
      return deleted;
    });
  }
}

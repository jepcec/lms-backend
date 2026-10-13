import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma/client';

// Serializa las transiciones que pueden retirar el último admin activo.
export async function lockAdminTransitions(
  prisma: Prisma.TransactionClient,
): Promise<void> {
  await prisma.$queryRaw`SELECT pg_advisory_xact_lock(684215739)::text AS locked`;
}

export async function assertActiveAdmin(
  prisma: Prisma.TransactionClient,
  currentUserId: string,
): Promise<void> {
  const admin = await prisma.user.findUnique({ where: { id: currentUserId } });
  if (
    admin?.role !== 'admin' ||
    admin.status !== 'active' ||
    admin.deleted_at !== null
  ) {
    throw new ForbiddenException('Administrador no autorizado');
  }
}

// Un admin no puede suspenderse, eliminarse ni quitarse el rol a sí mismo
// (se quedaría fuera del panel sin que otro admin lo note).
export function assertNotSelf(targetId: string, currentUserId: string, accion: string) {
  if (targetId === currentUserId) {
    throw new BadRequestException(`No puedes ${accion} tu propia cuenta`);
  }
}

// Evita dejar el sistema sin ningún admin activo al degradar, suspender o
// eliminar a un admin.
export async function assertNotLastActiveAdmin(
  prisma: Prisma.TransactionClient,
  target: { id: string; role: string },
) {
  if (target.role !== 'admin') return;
  const otrosAdmins = await prisma.user.count({
    where: {
      role: 'admin',
      status: 'active',
      deleted_at: null,
      id: { not: target.id },
    },
  });
  if (otrosAdmins === 0) {
    throw new BadRequestException(
      'No se puede dejar el sistema sin ningún administrador activo',
    );
  }
}

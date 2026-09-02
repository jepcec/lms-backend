// application/use-cases/merge-cart.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

// 1. Importamos el namespace directamente desde donde Prisma lo definió
import type * as Prisma from '../../../../generated/prisma/internal/prismaNamespace';

@Injectable()
export class MergeCartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(data: { userId: string; sessionToken: string }) {
    const { userId, sessionToken } = data;

    const [guestItems, userItems] = await Promise.all([
      this.prisma.cartItem.findMany({
        where: { session_token: sessionToken },
        include: { course: { select: { currency: true } } },
      }),
      this.prisma.cartItem.findMany({
        where: { user_id: userId },
        include: { course: { select: { currency: true } } },
      }),
    ]);

    const userCourseIds = new Set(userItems.map((i) => i.course_id));
    // El carrito no puede mezclar monedas: si el usuario ya tiene cursos en
    // una moneda, cualquier ítem de invitado en otra moneda se queda tal
    // cual (no se pierde, solo no se fusiona) en vez de romper esa regla.
    const targetCurrency = userItems[0]?.course.currency ?? guestItems[0]?.course.currency;

    // 2. Usamos el tipo PrismaPromise para que $transaction lo acepte
    // Esto quita el error de "not assignable to parameter of type 'never'"
    const operations: Prisma.PrismaPromise<any>[] = [];

    for (const guestItem of guestItems) {
      if (userCourseIds.has(guestItem.course_id)) {
        // RF-021: Si el curso ya existe en el perfil, borramos el temporal
        operations.push(
          this.prisma.cartItem.delete({ where: { id: guestItem.id } }),
        );
      } else if (targetCurrency && guestItem.course.currency !== targetCurrency) {
        continue;
      } else {
        // RF-021: Si es nuevo, lo vinculamos al usuario logueado
        operations.push(
          this.prisma.cartItem.update({
            where: { id: guestItem.id },
            data: {
              user_id: userId,
              session_token: null,
              expires_at: null,
            },
          }),
        );
      }
    }

    if (operations.length === 0) return [];

    // 3. Ejecución atómica de la fusión de carritos
    return await this.prisma.$transaction(operations);
  }
}

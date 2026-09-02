// application/use-cases/clear-cart.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ClearCartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: { userId?: string; token?: string }) {
    // Igual que en GetCartUseCase: sin userId ni token no hay carrito propio
    // que vaciar (el `OR` con ambos `undefined` borraría carritos ajenos).
    if (!filter.userId && !filter.token) {
      return { count: 0 };
    }

    return await this.prisma.cartItem.deleteMany({
      where: filter.userId
        ? { user_id: filter.userId }
        : { session_token: filter.token },
    });
  }
}

// application/use-cases/clear-cart.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ClearCartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: { userId?: string; token?: string }) {
    return await this.prisma.cartItem.deleteMany({
      where: {
        OR: [
          { user_id: filter.userId ?? undefined },
          { session_token: filter.token ?? undefined },
        ],
      },
    });
  }
}

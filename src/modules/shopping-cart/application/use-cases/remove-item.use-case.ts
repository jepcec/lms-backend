// application/use-cases/remove-item.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class RemoveItemUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    return await this.prisma.cartItem.delete({
      where: { id }
    });
  }
}
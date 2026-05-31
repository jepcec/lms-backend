import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ReorderCategoriasUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.category.update({
          where: { id },
          data: { display_order: index },
        }),
      ),
    );

    return { success: true };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class ListCategoriasUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.category.findMany({
      orderBy: { display_order: 'asc' },
    });
  }
}

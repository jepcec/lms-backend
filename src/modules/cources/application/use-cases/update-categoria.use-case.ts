import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateCategoriaDto } from '../dtos/update-categoria.dto';

@Injectable()
export class UpdateCategoriaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, dto: UpdateCategoriaDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }
}

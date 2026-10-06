import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { userSearchWhere } from '../../../../core/database/fuzzy-search';

@Injectable()
export class BuscarUsuariosUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(q: string, role?: string) {
    // Tolerante: sin tildes, palabra por palabra y con errores de tipeo
    const { ids, OR } = await userSearchWhere(this.prisma, q);
    const where: Record<string, unknown> = { OR };

    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
      },
      take: 20,
    });

    // Los más parecidos primero (fuzzySearchIds ya viene ordenado por parecido)
    const rank = new Map(ids.map((id, i) => [id, i]));
    return users.sort((a, b) => (rank.get(a.id) ?? -1) - (rank.get(b.id) ?? -1));
  }
}

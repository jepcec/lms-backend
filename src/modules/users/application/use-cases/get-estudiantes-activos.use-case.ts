import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';

@Injectable()
export class GetEstudiantesActivosUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AdminFiltersDto) {
    const hasta = filters.hasta ? new Date(filters.hasta) : new Date();
    const desde = filters.desde
      ? new Date(filters.desde)
      : new Date(hasta.getFullYear() - 1, hasta.getMonth(), 1);

    const meses = this.generarMesesEnRango(desde, hasta);
    const totalEstudiantes = await this.prisma.user.count({
      where: { role: 'estudiante', status: 'active' },
    });

    const result: Array<{ mes: string; activos: number; inactivos: number }> =
      [];

    for (const mes of meses) {
      const [year, month] = mes.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const activos = await this.prisma.enrollment.count({
        where: {
          last_accessed_at: { gte: monthStart, lte: monthEnd },
        },
      });

      result.push({
        mes,
        activos: activos > totalEstudiantes ? totalEstudiantes : activos,
        inactivos:
          totalEstudiantes -
          (activos > totalEstudiantes ? totalEstudiantes : activos),
      });
    }

    return result;
  }

  private generarMesesEnRango(desde: Date, hasta: Date) {
    const meses: string[] = [];
    const current = new Date(desde.getFullYear(), desde.getMonth(), 1);
    const end = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
    while (current <= end) {
      meses.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      );
      current.setMonth(current.getMonth() + 1);
    }
    return meses;
  }
}

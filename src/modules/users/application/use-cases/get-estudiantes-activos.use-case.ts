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

    // Antes: un `await` de enrollment.count() por mes, secuencial (12+
    // round-trips uno detrás del otro para un rango de 1 año). Ahora se piden
    // todos los meses en paralelo — mismo resultado, un solo round-trip
    // conjunto en vez de N. Promise.all conserva el orden del array de entrada.
    const result = await Promise.all(
      meses.map(async (mes) => {
        const [year, month] = mes.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const activos = await this.prisma.enrollment.count({
          where: {
            last_accessed_at: { gte: monthStart, lte: monthEnd },
          },
        });

        const activosClamped =
          activos > totalEstudiantes ? totalEstudiantes : activos;

        return {
          mes,
          activos: activosClamped,
          inactivos: totalEstudiantes - activosClamped,
        };
      }),
    );

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

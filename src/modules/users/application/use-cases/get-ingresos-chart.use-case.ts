import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';

@Injectable()
export class GetIngresosChartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AdminFiltersDto) {
    const { desde, hasta } = this.resolveRango(filters);

    const [onlineOrders, manualEnrollments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          payment_status: 'paid',
          created_at: { gte: desde, lte: hasta },
        },
        select: { created_at: true, total: true },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.enrollment.findMany({
        where: {
          enrollment_type: 'manual',
          offline_amount: { not: null },
          enrolled_at: { gte: desde, lte: hasta },
        },
        select: { enrolled_at: true, offline_amount: true },
        orderBy: { enrolled_at: 'asc' },
      }),
    ]);

    const monthlyMap = new Map<
      string,
      { total: number; online: number; manual: number }
    >();

    for (const order of onlineOrders) {
      const key = this.formatMonthKey(order.created_at);
      const entry = monthlyMap.get(key) ?? { total: 0, online: 0, manual: 0 };
      const amount = order.total.toNumber();
      entry.total += amount;
      entry.online += amount;
      monthlyMap.set(key, entry);
    }

    for (const enrollment of manualEnrollments) {
      const key = this.formatMonthKey(enrollment.enrolled_at);
      const entry = monthlyMap.get(key) ?? { total: 0, online: 0, manual: 0 };
      const amount = enrollment.offline_amount!.toNumber();
      entry.total += amount;
      entry.manual += amount;
      monthlyMap.set(key, entry);
    }

    const meses = this.generarMesesEnRango(desde, hasta);

    return meses.map((mes) => {
      const entry = monthlyMap.get(mes) ?? { total: 0, online: 0, manual: 0 };
      return {
        mes,
        total: Math.round(entry.total * 100) / 100,
        online: Math.round(entry.online * 100) / 100,
        manual: Math.round(entry.manual * 100) / 100,
      };
    });
  }

  private resolveRango(filters: AdminFiltersDto) {
    const hasta = filters.hasta ? new Date(filters.hasta) : new Date();
    const desde = filters.desde
      ? new Date(filters.desde)
      : new Date(hasta.getFullYear() - 1, hasta.getMonth(), 1);
    return { desde, hasta };
  }

  private formatMonthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private generarMesesEnRango(desde: Date, hasta: Date) {
    const meses: string[] = [];
    const current = new Date(desde.getFullYear(), desde.getMonth(), 1);
    const end = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
    while (current <= end) {
      meses.push(this.formatMonthKey(current));
      current.setMonth(current.getMonth() + 1);
    }
    return meses;
  }
}

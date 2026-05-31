import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filters: AdminFiltersDto) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [
      ingresosMes,
      ingresosMesAnterior,
      totalEstudiantes,
      nuevosEstudiantes,
      totalCursosActivos,
      nuevosCursos,
      totalEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      this.getIngresosEnRango(startOfMonth, now),
      this.getIngresosEnRango(startOfPrevMonth, endOfPrevMonth),
      this.prisma.user.count({
        where: { role: 'estudiante', status: 'active' },
      }),
      this.prisma.user.count({
        where: { role: 'estudiante', created_at: { gte: startOfMonth } },
      }),
      this.prisma.course.count({
        where: { status: 'published', deleted_at: null },
      }),
      this.prisma.course.count({
        where: {
          status: 'published',
          created_at: { gte: startOfMonth },
          deleted_at: null,
        },
      }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({ where: { completed_at: { not: null } } }),
    ]);

    const online = ingresosMes.online;
    const manual = ingresosMes.manual;
    const total_mes = online + manual;
    const total_mes_anterior =
      ingresosMesAnterior.online + ingresosMesAnterior.manual;
    const cambio_porcentual =
      total_mes_anterior > 0
        ? ((total_mes - total_mes_anterior) / total_mes_anterior) * 100
        : total_mes > 0
          ? 100
          : 0;

    const tasa_finalizacion =
      totalEnrollments > 0
        ? (completedEnrollments / totalEnrollments) * 100
        : 0;

    return {
      ingresos: {
        total_mes: Math.round(total_mes * 100) / 100,
        total_mes_anterior: Math.round(total_mes_anterior * 100) / 100,
        cambio_porcentual: Math.round(cambio_porcentual * 100) / 100,
        online: Math.round(online * 100) / 100,
        manual: Math.round(manual * 100) / 100,
      },
      estudiantes: {
        total: totalEstudiantes,
        nuevos_mes: nuevosEstudiantes,
      },
      cursos: {
        total_activos: totalCursosActivos,
        nuevos_mes: nuevosCursos,
      },
      tasa_finalizacion: Math.round(tasa_finalizacion * 100) / 100,
    };
  }

  private async getIngresosEnRango(desde: Date, hasta: Date) {
    const [onlineResult, manualResult] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          payment_status: 'paid',
          created_at: { gte: desde, lte: hasta },
        },
      }),
      this.prisma.enrollment.aggregate({
        _sum: { offline_amount: true },
        where: {
          enrollment_type: 'manual',
          enrolled_at: { gte: desde, lte: hasta },
        },
      }),
    ]);

    return {
      online: onlineResult._sum.total?.toNumber() ?? 0,
      manual: manualResult._sum.offline_amount?.toNumber() ?? 0,
    };
  }
}

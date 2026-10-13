import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { AdminFiltersDto } from '../dtos/admin-filters.dto';
import { GetDashboardStatsUseCase } from './get-dashboard-stats.use-case';
import { GetIngresosChartUseCase } from './get-ingresos-chart.use-case';
import { GetTopCursosUseCase } from './get-top-cursos.use-case';
import { GetCategoriasDistribucionUseCase } from './get-categorias-distribucion.use-case';
import { GetEstudiantesActivosUseCase } from './get-estudiantes-activos.use-case';
import { GetTopFinalizacionUseCase } from './get-top-finalizacion.use-case';
import { GetTopEstudiantesUseCase } from './get-top-estudiantes.use-case';

function headerRow(sheet: ExcelJS.Worksheet, headers: string[]) {
  const row = sheet.addRow(headers);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B55A3' },
  };
  sheet.columns = headers.map(() => ({ width: 22 }));
}

@Injectable()
export class ExportDashboardExcelUseCase {
  constructor(
    private readonly getStats: GetDashboardStatsUseCase,
    private readonly getIngresosChart: GetIngresosChartUseCase,
    private readonly getTopCursos: GetTopCursosUseCase,
    private readonly getCategoriasDistribucion: GetCategoriasDistribucionUseCase,
    private readonly getEstudiantesActivos: GetEstudiantesActivosUseCase,
    private readonly getTopFinalizacion: GetTopFinalizacionUseCase,
    private readonly getTopEstudiantes: GetTopEstudiantesUseCase,
  ) {}

  async execute(filters: AdminFiltersDto): Promise<Buffer> {
    const [
      stats,
      ingresos,
      topCursos,
      categorias,
      estudiantesActivos,
      topFinalizacion,
      topEstudiantes,
    ] = await Promise.all([
      this.getStats.execute(filters),
      this.getIngresosChart.execute(filters),
      this.getTopCursos.execute(filters),
      this.getCategoriasDistribucion.execute(),
      this.getEstudiantesActivos.execute(filters),
      this.getTopFinalizacion.execute(filters),
      this.getTopEstudiantes.execute(filters),
    ]);

    const workbook = new ExcelJS.Workbook();

    const resumen = workbook.addWorksheet('Resumen');
    headerRow(resumen, ['Indicador', 'Valor']);
    resumen.addRow(['Ingresos del mes', stats.ingresos.total_mes]);
    resumen.addRow([
      'Ingresos mes anterior',
      stats.ingresos.total_mes_anterior,
    ]);
    resumen.addRow(['Cambio porcentual (%)', stats.ingresos.cambio_porcentual]);
    resumen.addRow(['Ingresos online', stats.ingresos.online]);
    resumen.addRow(['Ingresos manuales', stats.ingresos.manual]);
    resumen.addRow(['Total estudiantes', stats.estudiantes.total]);
    resumen.addRow(['Estudiantes nuevos (mes)', stats.estudiantes.nuevos_mes]);
    resumen.addRow(['Cursos activos', stats.cursos.total_activos]);
    resumen.addRow(['Cursos nuevos (mes)', stats.cursos.nuevos_mes]);
    resumen.addRow(['Tasa de finalización (%)', stats.tasa_finalizacion]);

    const ingresosSheet = workbook.addWorksheet('Ingresos por mes');
    headerRow(ingresosSheet, ['Mes', 'Total', 'Online', 'Manual']);
    for (const item of ingresos) {
      ingresosSheet.addRow([item.mes, item.total, item.online, item.manual]);
    }

    const topCursosSheet = workbook.addWorksheet('Top cursos');
    headerRow(topCursosSheet, ['Curso', 'Matriculados', 'Ingresos']);
    for (const item of topCursos) {
      topCursosSheet.addRow([item.title, item.enrolled_count, item.revenue]);
    }

    const categoriasSheet = workbook.addWorksheet('Categorías');
    headerRow(categoriasSheet, ['Categoría', 'Cursos']);
    for (const item of categorias) {
      categoriasSheet.addRow([item.name, item.count]);
    }

    const estudiantesSheet = workbook.addWorksheet('Estudiantes activos');
    headerRow(estudiantesSheet, ['Mes', 'Activos', 'Inactivos']);
    for (const item of estudiantesActivos) {
      estudiantesSheet.addRow([item.mes, item.activos, item.inactivos]);
    }

    const finalizacionSheet = workbook.addWorksheet('Top finalización');
    headerRow(finalizacionSheet, [
      'Curso',
      'Matriculados',
      'Tasa finalización (%)',
    ]);
    for (const item of topFinalizacion) {
      finalizacionSheet.addRow([
        item.title,
        item.enrolled_count,
        item.completion_rate,
      ]);
    }

    const topEstudiantesSheet = workbook.addWorksheet('Top estudiantes');
    headerRow(topEstudiantesSheet, [
      'Nombres',
      'Apellidos',
      'Email',
      'Cursos',
      'Completados',
      'Horas vistas',
    ]);
    for (const item of topEstudiantes) {
      topEstudiantesSheet.addRow([
        item.first_name,
        item.last_name,
        item.email,
        item.courses_count,
        item.completed_count,
        item.total_watched_hours,
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

import { Controller, Get, Query, Param } from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ListUsuariosUseCase } from '../../application/use-cases/list-usuarios.use-case';
import { ListUsuariosDto } from '../../application/dtos/list-usuarios.dto';
import { AdminFiltersDto } from '../../application/dtos/admin-filters.dto';
import { AuditLogsQueryDto } from '../../application/dtos/audit-logs-query.dto';
import { MatriculadosQueryDto } from '../../application/dtos/matriculados-query.dto';
import { GetDashboardStatsUseCase } from '../../application/use-cases/get-dashboard-stats.use-case';
import { GetAuditLogsUseCase } from '../../application/use-cases/get-audit-logs.use-case';
import { GetIngresosChartUseCase } from '../../application/use-cases/get-ingresos-chart.use-case';
import { GetTopCursosUseCase } from '../../application/use-cases/get-top-cursos.use-case';
import { GetCategoriasDistribucionUseCase } from '../../application/use-cases/get-categorias-distribucion.use-case';
import { GetEstudiantesActivosUseCase } from '../../application/use-cases/get-estudiantes-activos.use-case';
import { GetTopFinalizacionUseCase } from '../../application/use-cases/get-top-finalizacion.use-case';
import { GetTopEstudiantesUseCase } from '../../application/use-cases/get-top-estudiantes.use-case';
import { GetMatriculadosCursoUseCase } from '../../application/use-cases/get-matriculados-curso.use-case';
import { GetActividadEstudianteUseCase } from '../../application/use-cases/get-actividad-estudiante.use-case';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(
    private readonly listUsuarios: ListUsuariosUseCase,
    private readonly getStats: GetDashboardStatsUseCase,
    private readonly getAuditLogs: GetAuditLogsUseCase,
    private readonly getIngresosChart: GetIngresosChartUseCase,
    private readonly getTopCursos: GetTopCursosUseCase,
    private readonly getCategoriasDistribucion: GetCategoriasDistribucionUseCase,
    private readonly getEstudiantesActivos: GetEstudiantesActivosUseCase,
    private readonly getTopFinalizacion: GetTopFinalizacionUseCase,
    private readonly getTopEstudiantes: GetTopEstudiantesUseCase,
    private readonly getMatriculadosCurso: GetMatriculadosCursoUseCase,
    private readonly getActividadEstudiante: GetActividadEstudianteUseCase,
  ) {}

  @Get('usuarios')
  async listUsuariosHandler(@Query() params: ListUsuariosDto) {
    return this.listUsuarios.execute(params);
  }

  @Get('stats')
  async statsHandler(@Query() filters: AdminFiltersDto) {
    return this.getStats.execute(filters);
  }

  @Get('auditoria')
  async auditLogsHandler(@Query() params: AuditLogsQueryDto) {
    return this.getAuditLogs.execute(params);
  }

  @Get('charts/ingresos')
  async ingresosChartHandler(@Query() filters: AdminFiltersDto) {
    return this.getIngresosChart.execute(filters);
  }

  @Get('charts/top-cursos')
  async topCursosHandler(@Query() filters: AdminFiltersDto) {
    return this.getTopCursos.execute(filters);
  }

  @Get('charts/categorias')
  async categoriasDistribucionHandler() {
    return this.getCategoriasDistribucion.execute();
  }

  @Get('charts/estudiantes')
  async estudiantesActivosHandler(@Query() filters: AdminFiltersDto) {
    return this.getEstudiantesActivos.execute(filters);
  }

  @Get('top-finalizacion')
  async topFinalizacionHandler(@Query() filters: AdminFiltersDto) {
    return this.getTopFinalizacion.execute(filters);
  }

  @Get('top-estudiantes')
  async topEstudiantesHandler(@Query() filters: AdminFiltersDto) {
    return this.getTopEstudiantes.execute(filters);
  }

  @Get('cursos/:cursoId/matriculados')
  async matriculadosCursoHandler(
    @Param('cursoId') cursoId: string,
    @Query() params: MatriculadosQueryDto,
  ) {
    return this.getMatriculadosCurso.execute(cursoId, params);
  }

  @Get('estudiantes/:userId/cursos/:courseId/actividad')
  async actividadEstudianteHandler(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.getActividadEstudiante.execute(userId, courseId);
  }
}

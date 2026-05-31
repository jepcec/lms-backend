import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ListMatriculasUseCase } from '../../application/use-cases/list-matriculas.use-case';
import { CreateMatriculasUseCase } from '../../application/use-cases/create-matriculas.use-case';
import { MatriculasParams } from '../../application/dtos/matriculas-params.dto';
import { CreateMatriculasDto } from '../../application/dtos/create-matriculas.dto';

@Controller('enrollments')
@Roles('admin')
export class EnrollmentsController {
  constructor(
    private readonly listMatriculas: ListMatriculasUseCase,
    private readonly createMatriculas: CreateMatriculasUseCase,
  ) {}

  @Get()
  async list(@Query() params: MatriculasParams) {
    return this.listMatriculas.execute(params);
  }

  @Post()
  async create(@Body() dto: CreateMatriculasDto) {
    return this.createMatriculas.execute(dto);
  }
}

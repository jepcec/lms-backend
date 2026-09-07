import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { ListMatriculasUseCase } from '../../application/use-cases/list-matriculas.use-case';
import { CreateMatriculasUseCase } from '../../application/use-cases/create-matriculas.use-case';
import { MatriculasParams } from '../../application/dtos/matriculas-params.dto';
import { CreateMatriculasDto } from '../../application/dtos/create-matriculas.dto';
import { DeleteEnrollmentUseCase } from '../../application/use-cases/delete-enrollment.use-case';
import { SuspendEnrollmentUseCase } from '../../application/use-cases/suspend-enrollment.use-case';
import { ReactivateEnrollmentUseCase } from '../../application/use-cases/reactivate-enrollment.use-case';

@Controller('enrollments')
@Roles('admin', 'soporte', 'coordinador')
export class EnrollmentsController {
  constructor(
    private readonly listMatriculas: ListMatriculasUseCase,
    private readonly createMatriculas: CreateMatriculasUseCase,
    private readonly deleteEnrollment: DeleteEnrollmentUseCase,
    private readonly suspendEnrollment: SuspendEnrollmentUseCase,
    private readonly reactivateEnrollment: ReactivateEnrollmentUseCase,
  ) {}

  @Get()
  async list(@Query() params: MatriculasParams) {
    return this.listMatriculas.execute(params);
  }

  @Post()
  async create(
    @Body() dto: CreateMatriculasDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createMatriculas.execute(dto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.deleteEnrollment.execute(id, userId);
  }

  @Patch(':id/suspender')
  async suspend(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.suspendEnrollment.execute(id, userId);
  }

  @Patch(':id/reactivar')
  async reactivate(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.reactivateEnrollment.execute(id, userId);
  }
}

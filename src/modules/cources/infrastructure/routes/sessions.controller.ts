import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { UpdateSessionUseCase } from '../../application/use-cases/update-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { GetSessionsUseCase } from '../../application/use-cases/get-sessions.use-case';
import { CreateSessionDto } from '../../application/dtos/create-session.dto';
import { UpdateSessionDto } from '../../application/dtos/update-session.dto';

@Controller()
export class SessionsController {
  constructor(
    private readonly createSession: CreateSessionUseCase,
    private readonly updateSession: UpdateSessionUseCase,
    private readonly deleteSession: DeleteSessionUseCase,
    private readonly getSessions: GetSessionsUseCase,
  ) {}

  @Public()
  @Get('modules/:moduleId/sessions')
  async getByModule(@Param('moduleId') moduleId: string) {
    return this.getSessions.executeByModule(moduleId);
  }

  @Public()
  @Get('sessions/:id')
  async getById(@Param('id') id: string) {
    return this.getSessions.executeById(id);
  }

  @Post('modules/:moduleId/sessions')
  async create(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateSessionDto,
  ) {
    dto.module_id = moduleId;
    return this.createSession.execute(dto);
  }

  @Patch('sessions/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.updateSession.execute(id, dto);
  }

  @Delete('sessions/:id')
  async delete(@Param('id') id: string) {
    return this.deleteSession.execute(id);
  }
}

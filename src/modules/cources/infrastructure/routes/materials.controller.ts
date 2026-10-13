import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { CreateMaterialUseCase } from '../../application/use-cases/create-material.use-case';
import { DeleteMaterialUseCase } from '../../application/use-cases/delete-material.use-case';
import { GetMaterialsUseCase } from '../../application/use-cases/get-materials.use-case';
import { CreateMaterialDto } from '../../application/dtos/create-material.dto';
import { DriveLinkInspectorService } from '../services/drive-link-inspector.service';

const MAX_URL_LENGTH = 2048;

@Controller()
export class MaterialsController {
  constructor(
    private readonly createMaterial: CreateMaterialUseCase,
    private readonly deleteMaterial: DeleteMaterialUseCase,
    private readonly getMaterials: GetMaterialsUseCase,
    private readonly driveLinkInspector: DriveLinkInspectorService,
  ) {}

  // Sin @Roles: cualquier usuario autenticado (el estudiante también lo usa
  // para decidir si muestra la vista previa o el aviso de archivo privado).
  @Get('materials/drive-check')
  async checkDriveLink(@Query('url') url?: string) {
    if (!url || url.length > MAX_URL_LENGTH) {
      throw new BadRequestException('Parámetro "url" inválido');
    }
    return this.driveLinkInspector.inspect(url);
  }

  @Get('sessions/:sessionId/materials')
  async getBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.getMaterials.executeBySession(sessionId, user);
  }

  @Post('sessions/:sessionId/materials')
  @Roles('admin', 'soporte')
  async create(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateMaterialDto,
  ) {
    dto.session_id = sessionId;
    return this.createMaterial.execute(dto);
  }

  @Delete('materials/:id')
  @Roles('admin', 'soporte')
  async delete(@Param('id') id: string) {
    return this.deleteMaterial.execute(id);
  }
}

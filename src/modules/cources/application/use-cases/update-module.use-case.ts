import { Injectable, Inject } from '@nestjs/common';
import { I_MODULE_REPOSITORY } from '../../domain/modules.repository';
import type { IModuleRepository } from '../../domain/modules.repository';
import { UpdateModuleDto } from '../dtos/update-module.dto';
import { ModuleEntity } from '../../domain/module.entity';

@Injectable()
export class UpdateModuleUseCase {
  constructor(
    @Inject(I_MODULE_REPOSITORY)
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(id: string, dto: UpdateModuleDto) {
    const existing = await this.moduleRepository.findById(id);
    if (!existing) throw new Error('Módulo no encontrado');

    const updated = new ModuleEntity({
      id: existing.id,
      course_id: existing.course_id,
      title: dto.title ?? existing.title,
      description:
        dto.description !== undefined ? dto.description : existing.description,
      display_order: dto.display_order ?? existing.display_order,
      created_at: existing.created_at,
    });
    await this.moduleRepository.save(updated);
    return { success: true, message: 'Módulo actualizado' };
  }
}

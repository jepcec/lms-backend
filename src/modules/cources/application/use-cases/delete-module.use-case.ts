import { Injectable, Inject } from '@nestjs/common';
import { I_MODULE_REPOSITORY } from '../../domain/modules.repository';
import type { IModuleRepository } from '../../domain/modules.repository';

@Injectable()
export class DeleteModuleUseCase {
  constructor(
    @Inject(I_MODULE_REPOSITORY)
    private readonly moduleRepository: IModuleRepository,
  ) {}

  async execute(id: string) {
    const module = await this.moduleRepository.findById(id);
    if (!module) throw new Error('Módulo no encontrado');

    await this.moduleRepository.delete(id);
    return { success: true, message: 'Módulo eliminado' };
  }
}

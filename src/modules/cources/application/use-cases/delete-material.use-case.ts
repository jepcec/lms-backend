import { Injectable, Inject } from '@nestjs/common';
import { I_MATERIAL_REPOSITORY } from '../../domain/materials.repository';
import type { IMaterialRepository } from '../../domain/materials.repository';

@Injectable()
export class DeleteMaterialUseCase {
  constructor(
    @Inject(I_MATERIAL_REPOSITORY)
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(id: string) {
    const material = await this.materialRepository.findById(id);
    if (!material) throw new Error('Material no encontrado');

    await this.materialRepository.delete(id);
    return { success: true, message: 'Material eliminado' };
  }
}

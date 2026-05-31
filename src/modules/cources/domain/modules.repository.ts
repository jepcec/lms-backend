import { ModuleEntity } from './module.entity';

export interface IModuleRepository {
  findById(id: string): Promise<ModuleEntity | null>;
  findByCourseId(courseId: string): Promise<ModuleEntity[]>;
  save(module: ModuleEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

export const I_MODULE_REPOSITORY = Symbol('IModuleRepository');

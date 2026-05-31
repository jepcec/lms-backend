import { MaterialEntity } from './material.entity';

export interface IMaterialRepository {
  findById(id: string): Promise<MaterialEntity | null>;
  findBySessionId(sessionId: string): Promise<MaterialEntity[]>;
  save(material: MaterialEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

export const I_MATERIAL_REPOSITORY = Symbol('IMaterialRepository');

import { SoftwareEntity } from './software.entity';

export interface ISoftwareRepository {
  findAll(onlyVigentes?: boolean): Promise<SoftwareEntity[]>;
  findById(id: string): Promise<SoftwareEntity | null>;
  create(software: Partial<SoftwareEntity>): Promise<SoftwareEntity>;
  update(
    id: string,
    software: Partial<SoftwareEntity>,
  ): Promise<SoftwareEntity>;
  delete(id: string): Promise<void>;
}

export const I_SOFTWARE_REPOSITORY = Symbol('ISoftwareRepository');

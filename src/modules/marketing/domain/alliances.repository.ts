import { AllianceEntity } from './alliance.entity';

export interface IAllianceRepository {
  findAll(onlyVigentes?: boolean): Promise<AllianceEntity[]>;
  findById(id: string): Promise<AllianceEntity | null>;
  create(alliance: Partial<AllianceEntity>): Promise<AllianceEntity>;
  update(
    id: string,
    alliance: Partial<AllianceEntity>,
  ): Promise<AllianceEntity>;
  delete(id: string): Promise<void>;
}

export const I_ALLIANCE_REPOSITORY = Symbol('IAllianceRepository');

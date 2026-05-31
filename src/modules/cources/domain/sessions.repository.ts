import { SessionEntity } from './session.entity';

export interface ISessionRepository {
  findById(id: string): Promise<SessionEntity | null>;
  findByModuleId(moduleId: string): Promise<SessionEntity[]>;
  save(session: SessionEntity): Promise<void>;
  delete(id: string): Promise<void>;
}

export const I_SESSION_REPOSITORY = Symbol('ISessionRepository');

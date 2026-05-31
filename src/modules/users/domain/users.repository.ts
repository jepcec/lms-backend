// ===================================================
// contratado de operaciones para base de datos
//
// ===================================================

import { UserEntity } from './user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;

  // confirmacion y verifiacion cuenta
  findByVerificationToken(token: string): Promise<UserEntity | null>;
  findByPasswordResetToken(token: string): Promise<UserEntity | null>;

  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ data: UserEntity[]; total: number }>;
}

export const I_USER_REPOSITORY = Symbol('IUserRepository');

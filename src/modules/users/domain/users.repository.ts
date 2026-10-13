// ===================================================
// contratado de operaciones para base de datos
//
// ===================================================

import { UserEntity } from './user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;
  setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  consumePasswordResetToken(
    userId: string,
    token: string,
    passwordHash: string,
  ): Promise<boolean>;
  verifyEmailWithToken(userId: string, token: string): Promise<boolean>;
  changePasswordIfCurrent(
    userId: string,
    currentHash: string,
    newHash: string,
  ): Promise<boolean>;
  revokeSessions(userId: string, sessionVersion: number): Promise<void>;

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

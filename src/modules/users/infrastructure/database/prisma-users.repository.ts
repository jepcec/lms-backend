import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/users.repository';
import { PrismaService } from 'src/core/database/prisma.service';
import { userSearchWhere } from 'src/core/database/fuzzy-search';
import { UserEntity } from '../../domain/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const dbUser = await this.prisma.user.findUnique({ where: { email } });
    if (!dbUser) return null;

    return new UserEntity({
      id: dbUser.id,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      phone: dbUser.phone,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,
      email_verified: dbUser.email_verified,
      status: dbUser.status,
      deleted_at: dbUser.deleted_at,
      session_version: (dbUser as typeof dbUser & { session_version: number })
        .session_version,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const dbUser = await this.prisma.user.findUnique({ where: { id } });
    if (!dbUser) return null;

    return new UserEntity({
      id: dbUser.id,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      phone: dbUser.phone,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,
      email_verified: dbUser.email_verified,
      status: dbUser.status,
      deleted_at: dbUser.deleted_at,
      session_version: (dbUser as typeof dbUser & { session_version: number })
        .session_version,
    });
  }

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    if (typeof token !== 'string' || token.length === 0) return null;
    const dbUser = await this.prisma.user.findFirst({
      where: { email_verification_token: token },
    });
    if (!dbUser) {
      return null;
    }
    return new UserEntity({
      id: dbUser.id,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      phone: dbUser.phone,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,

      email_verification_token: dbUser.email_verification_token,
      email_verified: dbUser.email_verified,
      email_verified_at: dbUser.email_verified_at,
    });
  }

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    if (typeof token !== 'string' || token.length === 0) return null;
    const dbUser = await this.prisma.user.findFirst({
      where: { password_reset_token: token },
    });
    if (!dbUser) {
      return null;
    }
    return new UserEntity({
      id: dbUser.id,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      email: dbUser.email,
      phone: dbUser.phone,
      passwordHash: dbUser.password_hash,
      role: dbUser.role,
      email_verification_token: dbUser.email_verification_token,
      email_verified: dbUser.email_verified,
      password_reset_token: dbUser.password_reset_token,
      password_reset_expires_at: dbUser.password_reset_expires_at,
    });
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password_reset_token: token,
        password_reset_expires_at: expiresAt,
      },
    });
  }

  async consumePasswordResetToken(
    userId: string,
    token: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: userId,
        password_reset_token: token,
        password_reset_expires_at: { gt: new Date() },
      },
      data: {
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        session_version: { increment: 1 },
      } as any,
    });
    return result.count === 1;
  }

  async verifyEmailWithToken(userId: string, token: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, email_verification_token: token, email_verified: false },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
        email_verification_token: null,
      },
    });
    return result.count === 1;
  }

  async changePasswordIfCurrent(
    userId: string,
    currentHash: string,
    newHash: string,
  ): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, password_hash: currentHash },
      data: {
        password_hash: newHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        session_version: { increment: 1 },
      } as any,
    });
    return result.count === 1;
  }

  async revokeSessions(userId: string, sessionVersion: number): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, session_version: sessionVersion } as any,
      data: { session_version: { increment: 1 } } as any,
    });
  }
  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ data: UserEntity[]; total: number }> {
    const { page, limit, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };

    if (search) {
      // Tolerante: sin tildes, palabra por palabra y con errores de tipeo
      where.OR = (await userSearchWhere(this.prisma, search)).OR;
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [dbUsers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = dbUsers.map(
      (dbUser) =>
        new UserEntity({
          id: dbUser.id,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          email: dbUser.email,
          phone: dbUser.phone,
          passwordHash: dbUser.password_hash,
          role: dbUser.role as any,
          email_verified: dbUser.email_verified,
          country: dbUser.country,
          profile_photo_url: dbUser.profile_photo_url,
          status: dbUser.status,
          created_by: dbUser.created_by,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at,
        }),
    );

    return { data, total };
  }

  // Solo se usa para el registro; no debe sobrescribir una cuenta existente.
  async save(user: UserEntity): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
        password_hash: user.passwordHash,
        role: user.role,
        country: user.country,
        profession: user.profession,
        email_verified: user.emailVerified,
        email_verified_at: user.emailVerifiedAt,
        email_verification_token: user.emailVerificationToken,
        password_reset_expires_at: user.passwordResetExpiresAt,
        password_reset_token: user.passwordResetToken,
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/users.repository';
import { PrismaService } from 'src/core/database/prisma.service';
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
    });
  }

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
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
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
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

  // diferentes saves para update o crear
  async save(user: UserEntity): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        first_name: user.first_name,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password_hash: user.passwordHash,

        email_verified: user.emailVerified,
        email_verified_at: user.emailVerifiedAt,
        email_verification_token: user.emailVerificationToken,
        password_reset_expires_at: user.passwordResetExpiresAt,
        password_reset_token: user.passwordResetToken,
      },
      create: {
        first_name: user.first_name,
        last_name: user.lastName,
        email: user.email,
        phone: user.phone,
        password_hash: user.passwordHash,
        role: user.role,
        email_verified: user.emailVerified,
        email_verified_at: user.emailVerifiedAt,
        email_verification_token: user.emailVerificationToken,
        password_reset_expires_at: user.passwordResetExpiresAt,
        password_reset_token: user.passwordResetToken,
      },
    });
  }
}

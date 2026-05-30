import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';
import {
  I_PASSWORD_SERVICE,
  type IPasswordService,
} from '../../domain/services/auth.service';
import {
  I_EMAIL_SERVICE,
  type IEmailService,
} from '../../domain/services/email.service';

@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
    @Inject(I_EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: CreateUsuarioDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashed = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        country: dto.country,
        role: dto.role,
        password_hash: hashed,
        email_verified: true,
        status: 'active',
      },
    });

    try {
      await this.emailService.sendAccountCreated(user.email, user.first_name);
    } catch {
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      country: user.country ?? undefined,
      role: user.role,
      profile_photo_url: user.profile_photo_url ?? undefined,
      email_verified: user.email_verified,
      status: user.status,
      created_by: user.created_by ?? undefined,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }
}

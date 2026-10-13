import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/users.repository';
import {
  I_PASSWORD_SERVICE,
  type IPasswordService,
} from '../../domain/services/auth.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(newPassword: string, token: string): Promise<void> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new BadRequestException('token invalido');
    }
    if (typeof newPassword !== 'string' || newPassword.length === 0) {
      throw new BadRequestException('Contraseña requerida');
    }
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException('token invalido');
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    const consumed = await this.userRepository.consumePasswordResetToken(
      user.id,
      token,
      passwordHash,
    );
    if (!consumed) throw new BadRequestException('token invalido');
  }
}

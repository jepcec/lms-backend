import { Inject, Injectable } from '@nestjs/common';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/users.repository';
import {
  I_EMAIL_SERVICE,
  type IEmailService,
} from '../../domain/services/email.service';
import { CryptoTokenService } from '../../infrastructure/services/crypto-token.service';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly cryptoService: CryptoTokenService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return; // seguridad para que no prueben correos
    const token = this.cryptoService.generateRamdomToken();
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpiresAt = expiredAt;
    await this.userRepository.save(user);
    await this.emailService.sendPasswordRecovery(user.email, token);
  }
}

import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/users.repository';
import {
  I_PASSWORD_SERVICE,
  type IPasswordService,
} from '../../domain/services/auth.service';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (
      typeof currentPassword !== 'string' ||
      currentPassword.length === 0 ||
      typeof newPassword !== 'string' ||
      newPassword.length === 0
    ) {
      throw new BadRequestException('Contraseñas inválidas');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isValid = await this.passwordService.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newHash = await this.passwordService.hash(newPassword);
    const changed = await this.userRepository.changePasswordIfCurrent(
      userId,
      user.passwordHash,
      newHash,
    );
    if (!changed) {
      throw new UnauthorizedException('La contraseña cambió. Intenta de nuevo');
    }
  }
}

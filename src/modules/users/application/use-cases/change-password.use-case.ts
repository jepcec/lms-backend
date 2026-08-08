import {
  Inject,
  Injectable,
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
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isValid = await this.passwordService.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    user.passwordHash = await this.passwordService.hash(newPassword);
    await this.userRepository.save(user);
  }
}

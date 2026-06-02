import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import type { IUserRepository } from '../../domain/users.repository';
import {
  I_PASSWORD_SERVICE,
  type IPasswordService,
} from '../../domain/services/auth.service';
import {
  I_AUTH_TOKEN_SERVICE,
  type IAuthTokenService,
} from '../../domain/services/auth.service';
import { LoginUserDto } from '../dtos/login-user.dto';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
    @Inject(I_AUTH_TOKEN_SERVICE)
    private readonly tokenService: IAuthTokenService,
  ) {}
  async execute(dto: LoginUserDto) {
    const userDb = await this.userRepository.findByEmail(dto.email);
    if (!userDb) throw new UnauthorizedException('Credenciales invalidas');

    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      userDb.passwordHash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Credenciales invalidas');

    // TOKENS  crear - refrescar - verificar
    const token = this.tokenService.generate({
      userId: userDb.id,
      role: userDb.role,
    });
    const refreshToken = this.tokenService.generateRefresh({
      userId: userDb.id,
      role: userDb.role,
    });

    // return {accessToken: token} // retorno inicial, para test
    return {
      accessToken: token,
      refresh_token: refreshToken,
      expires_in: 900, //15min
      user: {
        id: userDb.id,
        first_name: userDb.first_name,
        last_name: userDb.lastName,
        email: userDb.email,
        role: userDb.role,
      },
    };
  }
}

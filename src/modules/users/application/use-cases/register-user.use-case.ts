import { Injectable, Inject } from '@nestjs/common';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import type { IUserRepository } from '../../domain/users.repository';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { UserEntity } from '../../domain/user.entity';
import {
  I_PASSWORD_SERVICE,
  type IPasswordService,
  I_AUTH_TOKEN_SERVICE,
  type IAuthTokenService,
} from '../../domain/services/auth.service';
import { CryptoTokenService } from '../../infrastructure/services/crypto-token.service';
import {
  I_EMAIL_SERVICE,
  type IEmailService,
} from '../../domain/services/email.service';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(I_PASSWORD_SERVICE)
    private readonly passwordService: IPasswordService,
    @Inject(I_EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    @Inject(I_AUTH_TOKEN_SERVICE)
    private readonly tokenService: IAuthTokenService,

    private readonly criptoService: CryptoTokenService,
  ) {}

  async execute(dto: RegisterUserDto) {
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      country,
      profession,
    } = dto;
    const usuarioExiste = await this.userRepository.findByEmail(email);
    if (usuarioExiste) {
      throw new Error('Correo ya registrado');
    }

    const hashed = await this.passwordService.hash(password);
    const verificationToken = this.criptoService.generateRamdomToken();
    const nuevoUsuario = new UserEntity({
      id: crypto.randomUUID(),
      first_name,
      last_name,
      email,
      phone,
      passwordHash: hashed,
      role: 'estudiante',
      email_verified: false,
      email_verification_token: verificationToken,
      country: country ?? null,
      profession: profession ?? null,
    });

    console.log('TOKEN: ', nuevoUsuario.emailVerificationToken);

    await this.userRepository.save(nuevoUsuario);
    await this.emailService.sendEmailVerification(
      nuevoUsuario.email,
      verificationToken,
    );

    const accessToken = this.tokenService.generate({
      userId: nuevoUsuario.id,
      role: nuevoUsuario.role,
    });
    const refreshToken = this.tokenService.generateRefresh({
      userId: nuevoUsuario.id,
      role: nuevoUsuario.role,
    });

    return {
      success: true,
      message: 'Email de verificacion enviado',
      accessToken,
      refresh_token: refreshToken,
      user: {
        id: nuevoUsuario.id,
        first_name: nuevoUsuario.first_name,
        last_name: nuevoUsuario.lastName,
        email: nuevoUsuario.email,
        role: nuevoUsuario.role,
      },
    };
  }
}

// notes
// - sobre el id puede ser generado en backend o por la base de datos

// src/modules/users/application/use-cases/login-user.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserUseCase } from './login-user.use-case';
import { UnauthorizedException } from '@nestjs/common';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import { I_AUTH_TOKEN_SERVICE, I_PASSWORD_SERVICE } from '../../domain/services/auth.service';

const mockUserRepository = { findByEmail: jest.fn() };
const mockPasswordService = { compare: jest.fn() };
const mockTokenService = { generate: jest.fn().mockReturnValue('jwt_token_fake') };

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        { provide: I_USER_REPOSITORY, useValue: mockUserRepository },
        { provide: I_PASSWORD_SERVICE, useValue: mockPasswordService },
        { provide: I_AUTH_TOKEN_SERVICE, useValue: mockTokenService },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    jest.clearAllMocks();
  });

  it('debería devolver un token si las credenciales son válidas', async () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@test.com', passwordHash: 'hashed', role: 'estudiante' };
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockPasswordService.compare.mockResolvedValue(true);

    // Act
    const resultado = await useCase.execute({ email: 'test@test.com', password: 'password123' });

    // Assert
    expect(resultado).toHaveProperty('accessToken', 'jwt_token_fake');
    expect(mockPasswordService.compare).toHaveBeenCalledWith('password123', 'hashed');
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ passwordHash: 'hashed' });
    mockPasswordService.compare.mockResolvedValue(false); // Contraseña no coincide

    await expect(
      useCase.execute({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow(UnauthorizedException);
  });
});

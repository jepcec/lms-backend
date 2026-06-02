// src/modules/users/application/use-cases/login-user.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserUseCase } from './login-user.use-case';
import { UnauthorizedException } from '@nestjs/common';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import {
  I_AUTH_TOKEN_SERVICE,
  I_PASSWORD_SERVICE,
} from '../../domain/services/auth.service';

const mockUserRepository = { findByEmail: jest.fn() };
const mockPasswordService = { compare: jest.fn() };
const mockTokenService = {
  generate: jest.fn().mockReturnValue('jwt_token_fake'),
  generateRefresh: jest.fn().mockReturnValue('refresh_token_fake'),
};

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
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      passwordHash: 'hashed',
      role: 'estudiante',
      first_name: 'Test',
      lastName: 'User',
    };
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockPasswordService.compare.mockResolvedValue(true);

    const input = { email: 'test@test.com', password: 'password123' };
    console.log('INPUT:', input);

    // Act
    const resultado = await useCase.execute(input);
    console.log('OUTPUT:', resultado);

    // Assert
    expect(resultado).toHaveProperty('accessToken', 'jwt_token_fake');
    expect(resultado).toHaveProperty('refresh_token', 'refresh_token_fake');
    expect(resultado).toHaveProperty('expires_in', 900);
    expect(resultado.user).toMatchObject({
      id: '1',
      email: 'test@test.com',
      role: 'estudiante',
    });
    expect(mockPasswordService.compare).toHaveBeenCalledWith(
      'password123',
      'hashed',
    );
    expect(mockTokenService.generate).toHaveBeenCalledWith({
      userId: '1',
      role: 'estudiante',
    });
    expect(mockTokenService.generateRefresh).toHaveBeenCalledWith({
      userId: '1',
    });
  });

  it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
    const mockUser = { passwordHash: 'hashed' };
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockPasswordService.compare.mockResolvedValue(false); // Contraseña no coincide

    const input = { email: 'test@test.com', password: 'wrong' };
    console.log('INPUT:', input);

    await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
  });

  it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const input = { email: 'noexiste@test.com', password: 'password123' };
    console.log('INPUT:', input);

    await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
  });
});

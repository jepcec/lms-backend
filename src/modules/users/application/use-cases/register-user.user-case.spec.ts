// src/modules/users/application/use-cases/register-user.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import { I_PASSWORD_SERVICE } from '../../domain/services/auth.service';

const mockUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
};

const mockPasswordService = {
  hash: jest.fn().mockResolvedValue('hashed_password'), // Simulamos que siempre devuelve un hash
  compare: jest.fn(),
};

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: I_USER_REPOSITORY, useValue: mockUserRepository },
        { provide: I_PASSWORD_SERVICE, useValue: mockPasswordService },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    jest.clearAllMocks();
  });

  it('debería hashear la contraseña y registrar exitosamente', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const dto = {
      first_name: 'Jhon Doe',
      last_name: 'Body mars',
      email: 'jhon@test.com',
      password: 'plain_password', // Lo que envía el usuario
      phone: '999',
      role: 'estudiante' as any,
    };

    const resultado = await useCase.execute(dto);

    expect(resultado.mensaje).toBe('Usuario registrado con exito');
    // Verificamos que se llamó al servicio de hash
    expect(mockPasswordService.hash).toHaveBeenCalledWith('plain_password');
    // Verificamos que se guardó la entidad
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});

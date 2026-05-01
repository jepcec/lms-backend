// TEST: caso de uso register
import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { I_USER_REPOSITORY } from '../../domain/users.repository';
import { RegisterUserDto } from '../dtos/register-user.dto';

// 1. CREAMOS EL ACTOR FALSO (El Mock del Repositorio)
// Usamos jest.fn() para crear funciones "espía" que registrarán si fueron llamadas.
const mockUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
};

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  // Antes de CADA prueba, NestJS armará un mini-módulo en memoria
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: I_USER_REPOSITORY, // Buscamos la etiqueta física
          useValue: mockUserRepository, // ¡Le inyectamos el actor falso en vez de Prisma!
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    
    // Limpiamos los espías antes de cada prueba para no mezclar resultados
    jest.clearAllMocks(); 
  });

  // ==========================================
  // PRUEBA 1: EL CAMINO FELIZ (Todo sale bien)
  // ==========================================
  it('debería registrar un usuario exitosamente si el email no existe', async () => {
    
    // Preparación (Arrange): Le decimos al espía qué debe responder cuando le pregunten
    // Simulamos que buscó en la BD y NO encontró a nadie (devuelve null)
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const dto: RegisterUserDto = {
      fullName: 'Prueba Test',
      email: 'nuevo@test.com',
      phone: '123456',
      passwordHash: 'hash123',
      role: 'estudiante' as any,
    };

    // Ejecución (Act)
    const resultado = await useCase.execute(dto);

    // Verificación (Assert): Comprobamos que la lógica hizo lo que debía
    expect(resultado.mensaje).toBe('Usuario registrado con exito');
    
    // Verificamos que el Caso de Uso intentó buscar el email exactamente 1 vez
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nuevo@test.com');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
    
    // Verificamos que el Caso de Uso intentó guardar la nueva Entidad
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  // ==========================================
  // PRUEBA 2: EL CAMINO TRISTE (El email ya existe)
  // ==========================================
  it('debería lanzar un error si el usuario ya existe', async () => {
    
    // Preparación: Simulamos que la base de datos SÍ encontró un usuario
    mockUserRepository.findByEmail.mockResolvedValue({ id: '123', email: 'existe@test.com' });

    const dto: RegisterUserDto = {
      fullName: 'Tramposo',
      email: 'existe@test.com',
      phone: '123456',
      passwordHash: 'hash123',
      role: 'estudiante' as any,
    };

    // Ejecución y Verificación: Esperamos que lanzar execute() provoque un Error
    await expect(useCase.execute(dto)).rejects.toThrow('El usuario ya existe');

    // ¡CRÍTICO!: Verificamos que el sistema frenó y NUNCA intentó guardar
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

});

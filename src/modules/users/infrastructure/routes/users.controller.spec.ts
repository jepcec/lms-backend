import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AuthGuard } from '../services/auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UsersController } from './users.controller';

jest.mock('../../../../core/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('GET /api/users/me', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const user = {
    id: 'user-1',
    first_name: 'Ana',
    last_name: 'García',
    email: 'ana@example.com',
    phone: '999999999',
    country: null,
    profession: null,
    role: 'estudiante',
    profile_photo_url: null,
    email_verified: true,
    status: 'active',
    created_by: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    deleted_at: null,
    session_version: 2,
    password_hash: 'never-expose-this',
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        GetProfileUseCase,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                JWT_SECRET: 'test-access-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              })[key],
          },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
      .useMocker(() => ({}))
      .compile();

    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.findFirst.mockResolvedValue(user);
  });

  afterAll(async () => {
    await app.close();
  });

  const accessToken = (sessionVersion = 2) =>
    jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionVersion,
        tokenType: 'access',
      },
      { secret: 'test-access-secret', expiresIn: '5m' },
    );

  const refreshToken = (sessionVersion = 2) =>
    jwt.sign(
      { userId: user.id, sessionVersion, tokenType: 'refresh' },
      { secret: 'test-refresh-secret', expiresIn: '7d' },
    );

  it('returns the current public profile with no-store caching', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', `access_token=${accessToken()}`)
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    expect(response.body).not.toHaveProperty('password_hash');
    expect(response.body).not.toHaveProperty('session_version');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: user.id, deleted_at: null },
    });

    const profileResponse = await request(app.getHttpServer())
      .get(`/api/users/profile/${user.id}`)
      .set('Cookie', `access_token=${accessToken()}`)
      .expect(200);
    expect(response.body).toEqual(profileResponse.body);
  });

  it('renews access when only a valid refresh token remains', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', `refresh_token=${refreshToken()}`)
      .expect(200);

    expect(response.body.id).toBe(user.id);
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('access_token=')]),
    );
  });

  it('rejects missing or revoked sessions', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', `refresh_token=${refreshToken(1)}`)
      .expect(401);

    const expiredRefreshToken = jwt.sign(
      { userId: user.id, sessionVersion: 2, tokenType: 'refresh' },
      { secret: 'test-refresh-secret', expiresIn: '-1s' },
    );
    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', `refresh_token=${expiredRefreshToken}`)
      .expect(401);
  });
});

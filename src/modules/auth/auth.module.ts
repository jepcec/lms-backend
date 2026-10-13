import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '../users/infrastructure/services/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { requireSessionSecrets } from './session-token';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: requireSessionSecrets(config).access,
      }),
    }),
    // Rate limiting global por IP. Rutas individuales pueden ajustar esto con
    // @Throttle(...) (límite más estricto) o @SkipThrottle() (sin límite,
    // ej. webhooks server-to-server).
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}

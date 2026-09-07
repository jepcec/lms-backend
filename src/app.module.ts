import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/cources/courses.module';
import { ShoppingCartModule } from './modules/shopping-cart/shopping-cart.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsV2Module } from './modules/payments-v2/payments-v2.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: {
          paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'res.headers["set-cookie"]',
          ],
          censor: '[redacted]',
        },
        // No loguear cada request al health check, satura los logs.
        autoLogging: {
          ignore: (req) => req.url === '/api/health',
        },
        // Log de request/response reducido a lo esencial: el objeto req/res
        // completo de pino-http (headers, query, params, ips...) hacía cada
        // línea enorme e ilegible, sobre todo en dev. Con esto cada request
        // deja una sola línea corta tipo "GET /api/courses 200 - 12ms".
        customProps: () => ({ context: 'HTTP' }),
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
        customSuccessMessage: (req, res, responseTime) =>
          `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`,
        customErrorMessage: (req, res, err) =>
          `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
        // Sin `transport`: siempre JSON plano a stdout. "pino-pretty" es
        // devDependency (no viaja a la imagen de producción) — usarlo como
        // transport in-process rompía el arranque si NODE_ENV no llegaba en
        // runtime exactamente como "production" (ej. overrides de la
        // plataforma de despliegue). Para logs legibles en local, ver el
        // pipe a pino-pretty en el script "start:dev" de package.json.
      },
    }),
    DatabaseModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    ShoppingCartModule,
    MarketingModule,
    PaymentsModule,
    OrdersModule,
    PaymentsV2Module,
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}

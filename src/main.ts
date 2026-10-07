import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { getTrustedBrowserOrigins } from './modules/auth/trusted-browser-origins';
import { installRateLimitIpDiagnostics } from './core/rate-limit-ip-diagnostics';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  // La topología actual confía en Next.js como proxy inmediato. El diagnóstico
  // opcional permite verificar si req.ip llega a ser la IP real del visitante.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  installRateLimitIpDiagnostics(app, logger);
  app.setGlobalPrefix('api');

  // Servir archivos estáticos del storage local (solo dev — en prod se usa Cloudinary)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Headers de seguridad estándar + compresión de respuestas
  app.use(helmet());
  app.use(compression());

  // ================= cookies ===============
  app.use(cookieParser());
  app.enableCors({
    origin: getTrustedBrowserOrigins(),
    credentials: true,
  });
  // =========================================

  // Apagado ordenado: al recibir SIGTERM/SIGINT, Nest llama a los hooks
  // onModuleDestroy (ej. PrismaService desconecta la DB) antes de salir.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

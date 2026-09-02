import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // Servir archivos estáticos del storage local (solo dev — en prod se usa Cloudinary)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Headers de seguridad estándar + compresión de respuestas
  app.use(helmet());
  app.use(compression());

  // ================= cookies ===============
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.URL_FRONTEND,
    credentials: true,
  });
  // =========================================

  // Apagado ordenado: al recibir SIGTERM/SIGINT, Nest llama a los hooks
  // onModuleDestroy (ej. PrismaService desconecta la DB) antes de salir.
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

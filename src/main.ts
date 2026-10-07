import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { getTrustedBrowserOrigins } from './modules/auth/trusted-browser-origins';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  // En producción, /api llega desde el proxy inmediato de Next.js en lms-net.
  // Confiar en un solo salto permite que req.ip use la IP que Next reenvía en
  // X-Forwarded-For, sin confiar en toda la cadena enviada por el cliente.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
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

import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // Servir archivos estáticos del storage local (solo dev — en prod se usa Cloudinary)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // ================= cookies ===============
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.URL_FRONTEND,
    credentials: true,
  });
  // =========================================

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

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

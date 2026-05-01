import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './core/database/prisma.service';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
	ConfigModule.forRoot(), // para variables de .env globales
	UsersModule

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

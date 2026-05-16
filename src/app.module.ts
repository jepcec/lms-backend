import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './core/database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/cources/courses.module';
import { ShoppingCartModule } from './modules/shopping-cart/shopping-cart.module';

@Module({
  imports: [
	ConfigModule.forRoot(),
	AuthModule,
	UsersModule,
	CoursesModule,
  	ShoppingCartModule

  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

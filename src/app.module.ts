import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './core/database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/cources/courses.module';
import { ShoppingCartModule } from './modules/shopping-cart/shopping-cart.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
	ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Apunta a tu carpeta raíz de subidas
      serveRoot: '/uploads', // Prefijo de la URL
    }),
	ConfigModule.forRoot(),
	AuthModule,
	UsersModule,
	CoursesModule,
  	ShoppingCartModule,
    MarketingModule,
    PaymentsModule,

  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

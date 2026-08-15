import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from './core/database/prisma.service';
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
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

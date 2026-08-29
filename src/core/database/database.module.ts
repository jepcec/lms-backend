import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Módulo global: se importa una sola vez (en AppModule) y PrismaService queda
// disponible para inyectar en cualquier módulo sin volver a declararlo como
// provider — así hay un único PrismaClient/pool de Postgres por instancia de
// la app, en vez de uno por cada módulo que antes lo re-declaraba.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

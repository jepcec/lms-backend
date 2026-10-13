import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    this.logger.log('Cerrando conexión a la base de datos...');
    await this.$disconnect();
  }
}

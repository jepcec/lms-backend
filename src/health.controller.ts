import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './modules/auth/decorators/public.decorator';
import { PrismaService } from './core/database/prisma.service';

// Health check real para el orquestador (Docker HEALTHCHECK, Coolify, etc.):
// valida conexión real a la base de datos en vez de solo "el proceso responde".
@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}

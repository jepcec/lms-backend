import { Injectable } from '@nestjs/common';
import { PrismaService } from './core/database/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  getHello(): string {
    return 'Hello World!';
  }
  async getTestDb(): Promise<{}> {
    try {
      const result = await this.prisma.$queryRaw`
			  SELECT table_name
			  FROM information_schema.tables
			  WHERE table_schema = 'public';
			`;
      return { status: 'OK DB', message: result };
    } catch (error) {
      return { status: 'NO DB', message_error: error };
    }
  }
}

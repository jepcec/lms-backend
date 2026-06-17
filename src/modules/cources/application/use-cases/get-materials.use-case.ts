import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class GetMaterialsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async executeBySession(sessionId: string) {
    const materials = await this.prisma.material.findMany({
      where: { session_id: sessionId },
    });
    return materials.map((m) => ({
      id: m.id,
      name: m.name,
      drive_url: m.drive_url,
      type: m.type,
    }));
  }
}

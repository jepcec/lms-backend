import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AllianceEntity } from '../../domain/alliance.entity';
import { IAllianceRepository } from '../../domain/alliances.repository';
import { ContentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaAllianceRepository implements IAllianceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyVigentes = false): Promise<AllianceEntity[]> {
    const alliances = await this.prisma.alliance.findMany({
      where: onlyVigentes ? { status: ContentStatus.active } : undefined,
      orderBy: { display_order: 'asc' },
    });
    return alliances.map((a) => new AllianceEntity(a));
  }

  async findById(id: string): Promise<AllianceEntity | null> {
    const a = await this.prisma.alliance.findUnique({ where: { id } });
    if (!a) return null;
    return new AllianceEntity(a);
  }

  async create(data: Partial<AllianceEntity>): Promise<AllianceEntity> {
    const count = await this.prisma.alliance.count();
    const a = await this.prisma.alliance.create({
      data: {
        image_url: data.image_url!,
        image_public_id: data.image_public_id,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
      },
    });
    return new AllianceEntity(a);
  }

  async update(
    id: string,
    data: Partial<AllianceEntity>,
  ): Promise<AllianceEntity> {
    const a = await this.prisma.alliance.update({
      where: { id },
      data: {
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        display_order: data.display_order,
        status: data.status as ContentStatus,
      },
    });
    return new AllianceEntity(a);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alliance.delete({ where: { id } });
  }
}

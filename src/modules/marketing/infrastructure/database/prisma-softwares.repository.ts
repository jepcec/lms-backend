import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { SoftwareEntity } from '../../domain/software.entity';
import { ISoftwareRepository } from '../../domain/softwares.repository';
import { ContentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaSoftwareRepository implements ISoftwareRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyVigentes = false): Promise<SoftwareEntity[]> {
    const softwares = await this.prisma.software.findMany({
      where: onlyVigentes ? { status: ContentStatus.active } : undefined,
      orderBy: { display_order: 'asc' },
    });
    return softwares.map((s) => new SoftwareEntity(s));
  }

  async findById(id: string): Promise<SoftwareEntity | null> {
    const s = await this.prisma.software.findUnique({ where: { id } });
    if (!s) return null;
    return new SoftwareEntity(s);
  }

  async create(data: Partial<SoftwareEntity>): Promise<SoftwareEntity> {
    const count = await this.prisma.software.count();
    const s = await this.prisma.software.create({
      data: {
        name: data.name!,
        image_url: data.image_url!,
        image_public_id: data.image_public_id,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
      },
    });
    return new SoftwareEntity(s);
  }

  async update(
    id: string,
    data: Partial<SoftwareEntity>,
  ): Promise<SoftwareEntity> {
    const s = await this.prisma.software.update({
      where: { id },
      data: {
        name: data.name,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        display_order: data.display_order,
        status: data.status as ContentStatus,
      },
    });
    return new SoftwareEntity(s);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.software.delete({ where: { id } });
  }
}

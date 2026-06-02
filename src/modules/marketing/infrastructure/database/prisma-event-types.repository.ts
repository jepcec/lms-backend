import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { EventTypeEntity } from '../../domain/event-type.entity';
import { IEventTypeRepository } from '../../domain/event-types.repository';

@Injectable()
export class PrismaEventTypeRepository implements IEventTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<EventTypeEntity[]> {
    const rows = await this.prisma.eventType.findMany({
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => new EventTypeEntity(r));
  }

  async findById(id: string): Promise<EventTypeEntity | null> {
    const r = await this.prisma.eventType.findUnique({ where: { id } });
    return r ? new EventTypeEntity(r) : null;
  }

  async create(data: Partial<EventTypeEntity>): Promise<EventTypeEntity> {
    const count = await this.prisma.eventType.count();
    const r = await this.prisma.eventType.create({
      data: {
        name: data.name!,
        display_order: data.display_order ?? count,
      },
    });
    return new EventTypeEntity(r);
  }

  async update(id: string, data: Partial<EventTypeEntity>): Promise<EventTypeEntity> {
    const r = await this.prisma.eventType.update({
      where: { id },
      data: {
        name: data.name,
        display_order: data.display_order,
      },
    });
    return new EventTypeEntity(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eventType.delete({ where: { id } });
  }
}

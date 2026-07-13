import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ScrollPopupEntity } from '../../domain/scroll-popup.entity';
import { IScrollPopupRepository } from '../../domain/scroll-popups.repository';
import { ContentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaScrollPopupRepository implements IScrollPopupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyVigentes = false): Promise<ScrollPopupEntity[]> {
    const popups = await this.prisma.scrollPopup.findMany({
      where: onlyVigentes ? { status: ContentStatus.active } : undefined,
      orderBy: { display_order: 'asc' },
    });
    return popups.map((p) => new ScrollPopupEntity(p));
  }

  async findById(id: string): Promise<ScrollPopupEntity | null> {
    const p = await this.prisma.scrollPopup.findUnique({ where: { id } });
    if (!p) return null;
    return new ScrollPopupEntity(p);
  }

  async create(data: Partial<ScrollPopupEntity>): Promise<ScrollPopupEntity> {
    const count = await this.prisma.scrollPopup.count();
    const p = await this.prisma.scrollPopup.create({
      data: {
        image_url: data.image_url!,
        image_public_id: data.image_public_id,
        destination_url: data.destination_url,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
      },
    });
    return new ScrollPopupEntity(p);
  }

  async update(
    id: string,
    data: Partial<ScrollPopupEntity>,
  ): Promise<ScrollPopupEntity> {
    const p = await this.prisma.scrollPopup.update({
      where: { id },
      data: {
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        destination_url: data.destination_url,
        display_order: data.display_order,
        status: data.status as ContentStatus,
      },
    });
    return new ScrollPopupEntity(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.scrollPopup.delete({ where: { id } });
  }
}

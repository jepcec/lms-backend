import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PromotionEntity } from '../../domain/promotion.entity';
import { IPromotionRepository } from '../../domain/promotions.repository';
import { PromotionStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaPromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PromotionEntity[]> {
    const promotions = await this.prisma.promotion.findMany({
      orderBy: { display_order: 'asc' },
    });
    return promotions.map((p) => new PromotionEntity(p as any));
  }

  async findById(id: string): Promise<PromotionEntity | null> {
    const p = await this.prisma.promotion.findUnique({
      where: { id },
    });
    if (!p) return null;

    return new PromotionEntity(p);
  }

  async create(data: Partial<PromotionEntity>): Promise<PromotionEntity> {
    const count = await this.prisma.promotion.count();
    const p = await this.prisma.promotion.create({
      data: {
        title: data.title!,
        image_url: data.image_url!,
        destination_url: data.destination_url,
        destination_course_id: data.destination_course_id,
        display_order: data.display_order ?? count + 1,
        status: (data.status as PromotionStatus) ?? PromotionStatus.active,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
      },
    });
    return new PromotionEntity(p);
  }

  async update(
    id: string,
    data: Partial<PromotionEntity>,
  ): Promise<PromotionEntity> {
    const p = await this.prisma.promotion.update({
      where: { id },
      data: {
        title: data.title,
        image_url: data.image_url,
        destination_url: data.destination_url,
        destination_course_id: data.destination_course_id,
        display_order: data.display_order,
        status: data.status as PromotionStatus,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
      },
    });
    return new PromotionEntity(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.promotion.delete({
      where: { id },
    });
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.promotion.update({
          where: { id },
          data: { display_order: index + 1 },
        }),
      ),
    );
  }
}

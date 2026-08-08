import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpcomingLaunchEntity } from '../../domain/upcoming-launch.entity';
import { IUpcomingLaunchRepository } from '../../domain/upcoming-launches.repository';
import { ContentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaUpcomingLaunchRepository implements IUpcomingLaunchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyVigentes = false): Promise<UpcomingLaunchEntity[]> {
    const launches = await this.prisma.upcomingLaunch.findMany({
      where: onlyVigentes ? { status: ContentStatus.active } : undefined,
      orderBy: { display_order: 'asc' },
    });
    return launches.map((l) => new UpcomingLaunchEntity(l));
  }

  async findById(id: string): Promise<UpcomingLaunchEntity | null> {
    const l = await this.prisma.upcomingLaunch.findUnique({ where: { id } });
    if (!l) return null;
    return new UpcomingLaunchEntity(l);
  }

  async create(
    data: Partial<UpcomingLaunchEntity>,
  ): Promise<UpcomingLaunchEntity> {
    const count = await this.prisma.upcomingLaunch.count();
    const l = await this.prisma.upcomingLaunch.create({
      data: {
        category_label: data.category_label!,
        title: data.title!,
        start_date: data.start_date!,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        link_url: data.link_url,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
      },
    });
    return new UpcomingLaunchEntity(l);
  }

  async update(
    id: string,
    data: Partial<UpcomingLaunchEntity>,
  ): Promise<UpcomingLaunchEntity> {
    const l = await this.prisma.upcomingLaunch.update({
      where: { id },
      data: {
        category_label: data.category_label,
        title: data.title,
        start_date: data.start_date,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        link_url: data.link_url,
        display_order: data.display_order,
        status: data.status as ContentStatus,
      },
    });
    return new UpcomingLaunchEntity(l);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.upcomingLaunch.delete({ where: { id } });
  }
}

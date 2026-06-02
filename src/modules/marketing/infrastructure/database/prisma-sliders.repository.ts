import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { SliderEntity } from '../../domain/slider.entity';
import { ISliderRepository } from '../../domain/sliders.repository';
import {
  ContentStatus,
  SliderPosition,
  SliderType,
} from 'src/generated/prisma/enums';

@Injectable()
export class PrismaSliderRepository implements ISliderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    event_type: true,
    slider_courses: {
      include: { course: true },
      orderBy: { display_order: 'asc' as const },
    },
  };

  async findAll(): Promise<SliderEntity[]> {
    const sliders = await this.prisma.slider.findMany({
      include: this.include,
      orderBy: { display_order: 'asc' },
    });

    return sliders.map(
      (s) =>
        new SliderEntity({
          ...(s as any),
          courses: s.slider_courses.map((sc) => sc.course),
        }),
    );
  }

  async findById(id: string): Promise<SliderEntity | null> {
    const s = await this.prisma.slider.findUnique({
      where: { id },
      include: this.include,
    });

    if (!s) return null;

    return new SliderEntity({
      ...(s as any),
      courses: s.slider_courses.map((sc) => sc.course),
    });
  }

  async create(
    data: Partial<SliderEntity> & { course_ids?: string[] },
  ): Promise<SliderEntity> {
    const count = await this.prisma.slider.count();
    const s = await this.prisma.slider.create({
      data: {
        title: data.title!,
        subtitle: data.subtitle,
        type: data.type as SliderType,
        event_type_id: data.event_type_id ?? null,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        destination_url: data.destination_url,
        contact_url: data.contact_url,
        position_on_page: data.position_on_page as SliderPosition,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
        slider_courses: data.course_ids
          ? {
              create: data.course_ids.map((courseId, index) => ({
                course_id: courseId,
                display_order: index + 1,
              })),
            }
          : undefined,
      },
      include: this.include,
    });

    return new SliderEntity({
      ...(s as any),
      courses: s.slider_courses.map((sc) => sc.course),
    });
  }

  async update(
    id: string,
    data: Partial<SliderEntity> & { course_ids?: string[] },
  ): Promise<SliderEntity> {
    const { course_ids, ...rest } = data;

    const s = await this.prisma.slider.update({
      where: { id },
      data: {
        title: rest.title,
        subtitle: rest.subtitle,
        type: rest.type as SliderType,
        event_type_id: rest.event_type_id !== undefined ? rest.event_type_id : undefined,
        image_url: rest.image_url,
        image_public_id: rest.image_public_id,
        destination_url: rest.destination_url,
        contact_url: rest.contact_url,
        position_on_page: rest.position_on_page as SliderPosition,
        display_order: rest.display_order,
        status: rest.status as ContentStatus,
        slider_courses: course_ids
          ? {
              deleteMany: {},
              create: course_ids.map((courseId, index) => ({
                course_id: courseId,
                display_order: index + 1,
              })),
            }
          : undefined,
      },
      include: this.include,
    });

    return new SliderEntity({
      ...(s as any),
      courses: s.slider_courses.map((sc) => sc.course),
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.slider.delete({
      where: { id },
    });
  }
}

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { I_COURSE_REPOSITORY } from '../../domain/courses.repository';
import type { ICourseRepository } from '../../domain/courses.repository';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { CourseEntity } from '../../domain/course.entity';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject(I_COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateCourseDto, createdBy: string) {
    const slug = dto.slug || slugify(dto.title);

    const exists = await this.courseRepository.findBySlug(slug);
    if (exists) {
      throw new ConflictException('Curso con este slug ya existe');
    }

    const course = new CourseEntity({
      id: crypto.randomUUID(),
      category_id: dto.category_id,
      title: dto.title,
      slug,
      tagline: dto.tagline,
      description: dto.description,
      thumbnail_url: dto.thumbnail_url ?? '',
      level: dto.level,
      software_tools: dto.software_tools,
      price: dto.price,
      discount_price: dto.discount_price ?? null,
      currency: dto.currency,
      access_duration: dto.access_duration,
      prerequisites: dto.prerequisites,
      outcomes: dto.outcomes,
      status: dto.status,
      published_at: dto.status === 'published' ? new Date() : null,
      avg_rating: 0,
      review_count: 0,
      enrolled_count: 0,
      total_duration_minutes: 0,
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    await this.courseRepository.save(course);

    if (dto.instructors && dto.instructors.length > 0) {
      await this.prisma.instructor.createMany({
        data: dto.instructors.map((inst, idx) => ({
          course_id: course.id,
          full_name: inst.full_name,
          title: inst.title,
          description: inst.description ?? '',
          photo_url: inst.photo_url,
          display_order: idx + 1,
        })),
      });
    }

    return {
      success: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        created_at: course.created_at.toISOString(),
      },
    };
  }
}

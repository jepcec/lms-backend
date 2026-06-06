import { Injectable } from '@nestjs/common';
import type { ICourseRepository } from '../../domain/courses.repository';
import { PrismaService } from 'src/core/database/prisma.service';
import { CourseEntity } from '../../domain/course.entity';
import type { Course } from '@prisma/client';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CourseEntity | null> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) return null;
    return this.mapToEntity(course);
  }

  async findBySlug(slug: string): Promise<CourseEntity | null> {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course) return null;
    return this.mapToEntity(course);
  }

  async findAll(): Promise<CourseEntity[]> {
    const courses = await this.prisma.course.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
    return courses.map((c) => this.mapToEntity(c));
  }

  async findFeatured(limit: number): Promise<CourseEntity[]> {
    const courses = await this.prisma.course.findMany({
      where: { status: 'published', deleted_at: null },
      orderBy: { enrolled_count: 'desc' },
      take: limit,
    });
    return courses.map((c) => this.mapToEntity(c));
  }

  async save(course: CourseEntity): Promise<void> {
    await this.prisma.course.upsert({
      where: { id: course.id },
      update: {
        category_id: course.category_id,
        title: course.title,
        slug: course.slug,
        tagline: course.tagline,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        thumbnail_public_id: course.thumbnail_public_id,
        level: course.level,
        software_tools: course.software_tools,
        price: course.price,
        discount_price: course.discount_price,
        currency: course.currency,
        access_duration: course.access_duration,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        status: course.status,
        published_at: course.published_at,
        avg_rating: course.avg_rating,
        review_count: course.review_count,
        enrolled_count: course.enrolled_count,
        total_duration_minutes: course.total_duration_minutes,
        deleted_at: course.deleted_at,
      },
      create: {
        id: course.id,
        category_id: course.category_id,
        title: course.title,
        slug: course.slug,
        tagline: course.tagline,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        thumbnail_public_id: course.thumbnail_public_id,
        level: course.level,
        software_tools: course.software_tools,
        price: course.price,
        discount_price: course.discount_price,
        currency: course.currency,
        access_duration: course.access_duration,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        status: course.status,
        published_at: course.published_at,
        avg_rating: course.avg_rating,
        review_count: course.review_count,
        enrolled_count: course.enrolled_count,
        total_duration_minutes: course.total_duration_minutes,
        created_by: course.created_by,
        deleted_at: course.deleted_at,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.course.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  private mapToEntity(course: Course): CourseEntity {
    return new CourseEntity({
      id: course.id,
      category_id: course.category_id,
      title: course.title,
      slug: course.slug,
      tagline: course.tagline,
      description: course.description,
thumbnail_url: course.thumbnail_url,
        thumbnail_public_id: course.thumbnail_public_id,
        level: course.level,
        software_tools: course.software_tools,
      price: Number(course.price),
      discount_price: course.discount_price
        ? Number(course.discount_price)
        : null,
      currency: course.currency,
      access_duration: course.access_duration,
      prerequisites: course.prerequisites,
      outcomes: course.outcomes,
      status: course.status,
      published_at: course.published_at,
      avg_rating: Number(course.avg_rating),
      review_count: course.review_count,
      enrolled_count: course.enrolled_count,
      total_duration_minutes: course.total_duration_minutes,
      created_by: course.created_by,
      created_at: course.created_at,
      updated_at: course.updated_at,
      deleted_at: course.deleted_at,
    });
  }
}

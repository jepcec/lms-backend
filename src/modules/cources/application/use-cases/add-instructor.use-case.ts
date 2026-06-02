import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateInstructorDto } from '../dtos/create-instructor.dto';

@Injectable()
export class AddInstructorUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string, dto: CreateInstructorDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const maxOrder = await this.prisma.instructor.aggregate({
      _max: { display_order: true },
      where: { course_id: courseId },
    });

    const instructor = await this.prisma.instructor.create({
      data: {
        course_id: courseId,
        full_name: dto.full_name,
        title: dto.title,
        description: dto.description ?? '',
        photo_url: dto.photo_url,
        display_order:
          dto.display_order ?? (maxOrder._max.display_order ?? 0) + 1,
      },
    });

    return instructor;
  }
}

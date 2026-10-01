import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I_COURSE_REPOSITORY } from '../../domain/courses.repository';
import type { ICourseRepository } from '../../domain/courses.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { PrismaService } from '../../../../../src/core/database/prisma.service';

@Injectable()
export class DeleteCourseUseCase {
  constructor(
    @Inject(I_COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
    private readonly prisma: PrismaService, // 👈 Inyectamos PrismaService
  ) {}

  async execute(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (course.thumbnail_public_id) {
      await this.fileStorageService.delete(course.thumbnail_public_id);
    }

    // 🚀 1. Renombrar el slug para liberar la restricción UNIQUE en PostgreSQL
    await this.prisma.course.update({
      where: { id },
      data: {
        slug: `${course.slug}-deleted-${Date.now()}`,
      },
    });

    // 🚀 2. Ejecutar el borrado lógico en el repositorio
    await this.courseRepository.delete(id);

    return { success: true, message: 'Curso eliminado' };
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class GetCourseCertificationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, deleted_at: null },
      include: {
        modules: { orderBy: { display_order: 'asc' } },
        certificate_template: { select: { id: true, name: true } },
        constancia_template: { select: { id: true, name: true } },
      },
    });

    if (!course) throw new NotFoundException('Curso no encontrado');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId },
      include: {
        student: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        module_grades: true,
        certificate: { select: { id: true, type: true, issued_at: true } },
      },
      orderBy: { enrolled_at: 'asc' },
    });

    const students = enrollments.map((enrollment) => {
      const gradesMap: Record<string, number> = {};
      for (const mg of enrollment.module_grades) {
        gradesMap[mg.module_id] = Number(mg.grade);
      }

      return {
        enrollment_id: enrollment.id,
        user_id: enrollment.student.id,
        first_name: enrollment.student.first_name,
        last_name: enrollment.student.last_name,
        email: enrollment.student.email,
        average_grade: enrollment.average_grade
          ? Number(enrollment.average_grade)
          : null,
        module_grades: gradesMap,
        certificate_type: enrollment.certificate?.type ?? null,
        certificate_issued_at: enrollment.certificate?.issued_at ?? null,
        progress_percent: Number(enrollment.progress_percent),
      };
    });

    return {
      course_id: course.id,
      course_title: course.title,
      certification_mode: course.certification_mode,
      certificate_template: course.certificate_template,
      constancia_template: course.constancia_template,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        display_order: m.display_order,
      })),
      students,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class VerifyCertificateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { verification_code: code },
      include: {
        template: true,
        enrollment: {
          include: {
            course: {
              include: {
                instructors: { orderBy: { display_order: 'asc' } },
              },
            },
            student: true,
          },
        },
      },
    });

    if (cert) {
      const { enrollment, template } = cert;
      const { course, student } = enrollment;

      return {
        scope: 'course' as const,
        verification_code: cert.verification_code,
        type: cert.type,
        download_url: `/certificates/${cert.id}/download`,
        student_name: `${student.first_name} ${student.last_name}`,
        course_title: course.title,
        module_title: null,
        issued_at: cert.issued_at,
        total_hours: Math.round(course.total_duration_minutes / 60),
        instructors: course.instructors.map((i) => i.full_name),
        template: {
          background_image_url: template.background_image_url,
          back_image_url:
            (template as { back_image_url?: string }).back_image_url ?? null,
          student_name_position: template.student_name_position,
          qr_position: template.qr_position,
          qr_size: (template as { qr_size?: number }).qr_size ?? 300,
          font_family: template.font_family,
          font_sizes: template.font_sizes,
        },
      };
    }

    const moduleCert = await this.prisma.moduleCertificate.findUnique({
      where: { verification_code: code },
      include: {
        template: true,
        module: { select: { title: true } },
        enrollment: {
          include: {
            course: { select: { title: true } },
            student: true,
          },
        },
      },
    });

    if (!moduleCert) throw new NotFoundException('Certificado no encontrado');

    const { enrollment, template } = moduleCert;
    const { course, student } = enrollment;

    return {
      scope: 'module' as const,
      verification_code: moduleCert.verification_code,
      type: 'Certificado' as const,
      download_url: `/certificates/module/${moduleCert.id}/download`,
      student_name: `${student.first_name} ${student.last_name}`,
      course_title: course.title,
      module_title: moduleCert.module.title,
      issued_at: moduleCert.issued_at,
      total_hours: null,
      instructors: [] as string[],
      template: {
        background_image_url: template.background_image_url,
        back_image_url: template.back_image_url ?? null,
        student_name_position: template.student_name_position,
        qr_position: template.qr_position,
        qr_size: template.qr_size ?? 300,
        font_family: template.font_family,
        font_sizes: template.font_sizes,
      },
    };
  }
}

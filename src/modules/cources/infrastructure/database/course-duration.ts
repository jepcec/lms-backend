import type { PrismaService } from 'src/core/database/prisma.service';

/**
 * `Course.total_duration_minutes` es la suma de la duración de todas sus
 * sesiones. Se imprime como "horas" en el certificado y alimenta los filtros
 * de duración del catálogo, así que se recalcula cada vez que se crea, edita
 * o borra una sesión o un módulo.
 */
export async function recalculateCourseDuration(
  prisma: PrismaService,
  courseId: string,
): Promise<void> {
  const total = await prisma.session.aggregate({
    where: { module: { course_id: courseId } },
    _sum: { duration_minutes: true },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: { total_duration_minutes: total._sum.duration_minutes ?? 0 },
  });
}

export async function recalculateCourseDurationByModule(
  prisma: PrismaService,
  moduleId: string,
): Promise<void> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { course_id: true },
  });
  if (module) await recalculateCourseDuration(prisma, module.course_id);
}

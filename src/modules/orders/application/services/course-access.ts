import type { Prisma } from 'src/generated/prisma/client';
import { PaymentStatus } from 'src/generated/prisma/enums';

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Nuevo vencimiento al renovar: los meses se suman a lo que le queda al
 * estudiante (renovar antes de vencer no le hace perder tiempo pagado); si ya
 * venció, se cuentan desde hoy.
 */
export function renewedExpiry(currentExpiry: Date, months: number, now = new Date()): Date {
  const base = currentExpiry > now ? currentExpiry : now;
  return addMonths(base, months);
}

export type CourseAccessGrant =
  | { kind: 'created'; course_id: string; title: string; slug: string }
  | { kind: 'renewed'; course_id: string; access_expires_at: Date }
  /** Matrícula sin fecha de vencimiento: ya tiene acceso permanente. */
  | { kind: 'unchanged'; course_id: string };

/**
 * Da acceso a un curso pagado. Si el estudiante ya tiene la matrícula, es una
 * renovación: solo se extiende access_expires_at y se conserva todo lo demás
 * (progreso, notas, reseña y certificados) tal como estaba.
 */
export async function grantCourseAccess(
  tx: Prisma.TransactionClient,
  params: { userId: string; courseId: string; orderId: string; accessMonths: number },
): Promise<CourseAccessGrant> {
  const existing = await tx.enrollment.findUnique({
    where: { user_id_course_id: { user_id: params.userId, course_id: params.courseId } },
  });

  if (existing) {
    if (!existing.access_expires_at) {
      return { kind: 'unchanged', course_id: params.courseId };
    }
    const access_expires_at = renewedExpiry(existing.access_expires_at, params.accessMonths);
    await tx.enrollment.update({
      where: { id: existing.id },
      data: { access_expires_at },
    });
    return { kind: 'renewed', course_id: params.courseId, access_expires_at };
  }

  const enrollment = await tx.enrollment.create({
    data: {
      user_id: params.userId,
      course_id: params.courseId,
      order_id: params.orderId,
      enrollment_type: 'online',
      progress_percent: 0,
      access_expires_at: addMonths(new Date(), params.accessMonths),
    },
    include: { course: { select: { title: true, slug: true } } },
  });

  await tx.course.update({
    where: { id: params.courseId },
    data: { enrolled_count: { increment: 1 } },
  });

  return {
    kind: 'created',
    course_id: params.courseId,
    title: enrollment.course.title,
    slug: enrollment.course.slug,
  };
}

/**
 * Marca la orden como pagada y otorga el acceso a sus cursos, una sola vez por
 * orden. La confirmación síncrona y el webhook de la pasarela pueden llegar
 * por el mismo pago (incluso a la vez): el `updateMany` condicionado bloquea la
 * fila, así que solo la primera llamada procesa los cursos. Sin esto, una
 * renovación se sumaría dos veces.
 */
export async function confirmPaidOrder(
  tx: Prisma.TransactionClient,
  params: { orderId: string; gatewayId: string; method: string },
) {
  const marked = await tx.order.updateMany({
    where: { id: params.orderId, payment_status: { not: PaymentStatus.paid } },
    data: {
      payment_status: PaymentStatus.paid,
      gateway_transaction_id: params.gatewayId,
      payment_method: params.method as any,
    },
  });

  const order = await tx.order.findUniqueOrThrow({
    where: { id: params.orderId },
    include: {
      order_items: {
        include: { course: { select: { access_duration_months: true } } },
      },
    },
  });

  if (marked.count === 0) {
    return { order, grants: [] as CourseAccessGrant[], alreadyProcessed: true };
  }

  const grants: CourseAccessGrant[] = [];
  for (const item of order.order_items) {
    grants.push(
      await grantCourseAccess(tx, {
        userId: order.user_id,
        courseId: item.course_id,
        orderId: order.id,
        accessMonths: item.course.access_duration_months,
      }),
    );
  }

  await tx.cartItem.deleteMany({ where: { user_id: order.user_id } });

  return { order, grants, alreadyProcessed: false };
}

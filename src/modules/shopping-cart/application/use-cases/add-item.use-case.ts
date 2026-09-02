// application/use-cases/add-item.use-case.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AddItemDto } from '../dtos/add-item.dto';

@Injectable()
export class AddItemUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: AddItemDto) {
    const { course_id, user_id, session_token } = dto;

    // Sin user_id (sesión identificada) ni session_token (invitado) no hay
    // dueño posible para el item: antes esto creaba un cart_item huérfano
    // que nunca podía llegar a una orden real.
    if (!user_id && !session_token) {
      throw new BadRequestException(
        'No se pudo identificar tu sesión. Recarga la página e intenta de nuevo.',
      );
    }

    // 1. Validación: ¿Ya está matriculado? (Solo si hay user_id)
    if (user_id) {
      const isEnrolled = await this.prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id, course_id } },
      });
      if (isEnrolled)
        throw new BadRequestException('Ya estás matriculado en este curso.');
    }

    // 2. Validación: ¿Ya está en el carrito?
    const ownerFilter = user_id ? { user_id } : { session_token };
    const alreadyInCart = await this.prisma.cartItem.findFirst({
      where: { course_id, ...ownerFilter },
    });
    if (alreadyInCart)
      throw new BadRequestException('El curso ya está en tu carrito.');

    // 3. Validación: el carrito no puede mezclar monedas (una orden solo
    // puede cobrarse en una moneda, y cada pasarela solo soporta una).
    const course = await this.prisma.course.findUnique({
      where: { id: course_id },
      select: { currency: true },
    });
    const existingItem = await this.prisma.cartItem.findFirst({
      where: ownerFilter,
      include: { course: { select: { currency: true } } },
    });
    if (existingItem && course && existingItem.course.currency !== course.currency) {
      throw new BadRequestException(
        `Tu carrito ya tiene cursos en ${existingItem.course.currency}. Vacíalo o completa esa compra antes de agregar cursos en ${course.currency}.`,
      );
    }

    // 4. Registro con expiración para invitados (7 días)
    const expiresAt = user_id
      ? null
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await this.prisma.cartItem.create({
      data: { course_id, user_id, session_token, expires_at: expiresAt },
      include: { course: true },
    });
  }
}

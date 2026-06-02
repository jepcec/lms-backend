// application/use-cases/add-item.use-case.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AddItemDto } from '../dtos/add-item.dto';

@Injectable()
export class AddItemUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: AddItemDto) {
    const { course_id, user_id, session_token } = dto;

    // 1. Validación: ¿Ya está matriculado? (Solo si hay user_id)
    if (user_id) {
      const isEnrolled = await this.prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id, course_id } },
      });
      if (isEnrolled)
        throw new BadRequestException('Ya estás matriculado en este curso.');
    }

    // 2. Validación: ¿Ya está en el carrito?
    const alreadyInCart = await this.prisma.cartItem.findFirst({
      where: {
        course_id,
        OR: [
          { user_id: user_id ?? undefined },
          { session_token: session_token ?? undefined },
        ],
      },
    });
    if (alreadyInCart)
      throw new BadRequestException('El curso ya está en tu carrito.');

    // 3. Registro con expiración para invitados (7 días)
    const expiresAt = user_id
      ? null
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await this.prisma.cartItem.create({
      data: { course_id, user_id, session_token, expires_at: expiresAt },
      include: { course: true },
    });
  }
}

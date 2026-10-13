// application/use-cases/remove-item.use-case.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class RemoveItemUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string, userId?: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');

    // Un ítem de un usuario solo lo puede quitar ese usuario. Los ítems de
    // invitado (session_token) se identifican solo por su UUID porque el
    // frontend aún no envía el session_token al eliminar.
    if (item.user_id && item.user_id !== userId) {
      throw new ForbiddenException('No puedes modificar el carrito de otro usuario');
    }

    return await this.prisma.cartItem.delete({
      where: { id },
    });
  }
}

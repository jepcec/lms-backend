// application/use-cases/get-cart.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

// la ruta que archivo Course.ts
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class GetCartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: { userId?: string; token?: string }) {
    // Sin userId ni token no hay carrito que identificar: devolver vacío.
    // (antes esto armaba `OR: [{ user_id: undefined }, { session_token: undefined }]`,
    // que Prisma no interpreta como "sin resultados" sino como una condición
    // sin filtro real, devolviendo carritos de otros usuarios/invitados)
    if (!filter.userId && !filter.token) {
      return { items: [], totalCount: 0, subtotal: 0, currency: 'USD' };
    }

    const items = await this.prisma.cartItem.findMany({
      where: filter.userId
        ? { user_id: filter.userId }
        : { session_token: filter.token },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            price: true,
            discount_price: true,
            currency: true,
          },
        },
      },
    });

    // Cálculo de totales usando la lógica de Decimal
    let subtotal = new Decimal(0);

    const formattedItems = items.map((item) => {
      const priceToCharge = item.course.discount_price || item.course.price;
      subtotal = subtotal.add(priceToCharge);

      return {
        cartItemId: item.id,
        courseId: item.course.id,
        title: item.course.title,
        slug: item.course.slug,
        thumbnail: item.course.thumbnail_url,
        price: item.course.price,
        discountPrice: item.course.discount_price,
        finalPrice: priceToCharge,
        currency: item.course.currency,
      };
    });

    return {
      items: formattedItems,
      totalCount: formattedItems.length,
      subtotal: subtotal.toNumber(), // Convertimos al final para el JSON
      currency: formattedItems[0]?.currency || 'USD',
    };
  }
}

// application/use-cases/get-cart.use-case.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

// la ruta que archivo Course.ts
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class GetCartUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: { userId?: string; token?: string }) {
    const items = await this.prisma.cartItem.findMany({
      where: {
        OR: [
          { user_id: filter.userId ?? undefined },
          { session_token: filter.token ?? undefined },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail_url: true,
            price_pen: true,
            discount_price_pen: true,
            price_usd: true,
            discount_price_usd: true,
          },
        },
      },
    });

    // Cálculo de totales usando la lógica de Decimal
    let subtotal = new Decimal(0);

    const formattedItems = items.map((item) => {
      const priceToCharge =
        item.course.discount_price_pen || item.course.price_pen;
      subtotal = subtotal.add(priceToCharge);

      return {
        cartItemId: item.id,
        courseId: item.course.id,
        title: item.course.title,
        slug: item.course.slug,
        thumbnail: item.course.thumbnail_url,
        price: item.course.price_pen,
        discountPrice: item.course.discount_price_pen,
        finalPrice: priceToCharge,
        currency: 'PEN' as const,
        priceUsd: item.course.price_usd,
        discountPriceUsd: item.course.discount_price_usd,
      };
    });

    return {
      items: formattedItems,
      totalCount: formattedItems.length,
      subtotal: subtotal.toNumber(), // Convertimos al final para el JSON
      currency: 'PEN' as const,
    };
  }
}

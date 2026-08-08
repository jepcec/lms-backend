import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { AddItemUseCase } from '../../application/use-cases/add-item.use-case';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { RemoveItemUseCase } from '../../application/use-cases/remove-item.use-case';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case';
import { MergeCartUseCase } from '../../application/use-cases/merge-cart.use-case';
import { AddItemDto } from '../../application/dtos/add-item.dto';

// Nota: el controller es @Public() para que los invitados puedan usar el carrito
// sin sesión. AuthGuard igual intenta decodificar la cookie si existe (auth
// "suave"), así que @CurrentUser() puede venir poblado o undefined según el caso.
// El userId SIEMPRE se resuelve desde la sesión (nunca desde el body/query del
// cliente) para que nadie pueda leer o modificar el carrito de otro usuario.
@Controller('cart')
@Public()
export class CartController {
  constructor(
    private readonly addItemUC: AddItemUseCase,
    private readonly getCartUC: GetCartUseCase,
    private readonly removeItemUC: RemoveItemUseCase,
    private readonly clearCartUC: ClearCartUseCase,
    private readonly mergeCartUC: MergeCartUseCase,
  ) {}

  @Get() // GET /cart
  async getCart(
    @CurrentUser('userId') userId?: string,
    @Query('session_token') token?: string,
  ) {
    return this.getCartUC.execute({ userId, token });
  }

  @Post('add') // POST /cart/add
  async addItem(
    @Body() dto: AddItemDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.addItemUC.execute({
      ...dto,
      user_id: userId,
      session_token: userId ? undefined : dto.session_token,
    });
  }

  @Delete('remove/:id') // DELETE /cart/remove/:id
  async removeItem(@Param('id') id: string) {
    return this.removeItemUC.execute(id);
  }

  @Delete('clear') // DELETE /cart/clear
  async clear(
    @CurrentUser('userId') userId?: string,
    @Query('session_token') token?: string,
  ) {
    return this.clearCartUC.execute({ userId, token });
  }

  @Post('merge') // POST /cart/merge
  async merge(
    @Body() data: { session_token: string },
    @CurrentUser('userId') userId?: string,
  ) {
    if (!userId) {
      throw new ForbiddenException(
        'Necesitas iniciar sesión para fusionar el carrito',
      );
    }
    return this.mergeCartUC.execute({
      userId,
      sessionToken: data.session_token,
    });
  }
}

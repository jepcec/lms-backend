import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AddItemUseCase } from '../../application/use-cases/add-item.use-case';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { RemoveItemUseCase } from '../../application/use-cases/remove-item.use-case';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case';
import { MergeCartUseCase } from '../../application/use-cases/merge-cart.use-case';
import { AddItemDto } from '../../application/dtos/add-item.dto';

@Controller('cart')
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
    @Query('userId') userId?: string,
    @Query('token') token?: string,
  ) {
    return this.getCartUC.execute({ userId, token });
  }

  @Post('add') // POST /cart/add
  async addItem(@Body() dto: AddItemDto) {
    return this.addItemUC.execute(dto);
  }

  @Delete('remove/:id') // DELETE /cart/remove/:id
  async removeItem(@Param('id') id: string) {
    return this.removeItemUC.execute(id);
  }

  @Delete('clear') // DELETE /cart/clear
  async clear(
    @Query('userId') userId?: string,
    @Query('token') token?: string,
  ) {
    return this.clearCartUC.execute({ userId, token });
  }

  @Post('merge') // POST /cart/merge
  async merge(@Body() data: { userId: string; sessionToken: string }) {
    return this.mergeCartUC.execute(data);
  }
}

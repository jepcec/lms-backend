// shopping-cart.module.ts
import { Module } from '@nestjs/common';
import { CartController } from './infrastructure/routes/cart.controller';
import { AddItemUseCase } from './application/use-cases/add-item.use-case';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { RemoveItemUseCase } from './application/use-cases/remove-item.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { MergeCartUseCase } from './application/use-cases/merge-cart.use-case';

@Module({
  controllers: [CartController],
  providers: [
    AddItemUseCase,
    GetCartUseCase,
    RemoveItemUseCase,
    ClearCartUseCase,
    MergeCartUseCase,
  ],
})
export class ShoppingCartModule {}

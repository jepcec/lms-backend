import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import type { CreateOrderDto } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.createOrder.execute(userId, dto);
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.getOrder.execute(id, userId, role);
  }
}

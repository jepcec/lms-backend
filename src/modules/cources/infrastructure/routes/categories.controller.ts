import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Public } from '../../../auth/decorators/public.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ListCategoriasUseCase } from '../../application/use-cases/list-categorias.use-case';
import { GetCategoriaUseCase } from '../../application/use-cases/get-categoria.use-case';
import { CreateCategoriaUseCase } from '../../application/use-cases/create-categoria.use-case';
import { UpdateCategoriaUseCase } from '../../application/use-cases/update-categoria.use-case';
import { DeleteCategoriaUseCase } from '../../application/use-cases/delete-categoria.use-case';
import { ReorderCategoriasUseCase } from '../../application/use-cases/reorder-categorias.use-case';
import { CreateCategoriaDto } from '../../application/dtos/create-categoria.dto';
import { UpdateCategoriaDto } from '../../application/dtos/update-categoria.dto';
import { ReorderCategoriasDto } from '../../application/dtos/reorder-categorias.dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly listCategorias: ListCategoriasUseCase,
    private readonly getCategoria: GetCategoriaUseCase,
    private readonly createCategoria: CreateCategoriaUseCase,
    private readonly updateCategoria: UpdateCategoriaUseCase,
    private readonly deleteCategoria: DeleteCategoriaUseCase,
    private readonly reorderCategorias: ReorderCategoriasUseCase,
  ) {}

  @Get()
  @Public()
  async list() {
    return this.listCategorias.execute();
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    return this.getCategoria.execute(id);
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateCategoriaDto) {
    return this.createCategoria.execute(dto);
  }

  @Patch('reorder')
  @Roles('admin')
  async reorder(@Body() dto: ReorderCategoriasDto) {
    return this.reorderCategorias.execute(dto.ids);
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.updateCategoria.execute(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return this.deleteCategoria.execute(id);
  }
}

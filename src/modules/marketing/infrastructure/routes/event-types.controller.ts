import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CreateEventTypeDto } from '../../application/dtos/create-event-type.dto';
import { UpdateEventTypeDto } from '../../application/dtos/update-event-type.dto';
import { CreateEventTypeUseCase } from '../../application/use-cases/create-event-type.use-case';
import { DeleteEventTypeUseCase } from '../../application/use-cases/delete-event-type.use-case';
import { GetEventTypesUseCase } from '../../application/use-cases/get-event-types.use-case';
import { UpdateEventTypeUseCase } from '../../application/use-cases/update-event-type.use-case';

@Controller('event-types')
export class EventTypesController {
  constructor(
    private readonly getEventTypesUseCase: GetEventTypesUseCase,
    private readonly createEventTypeUseCase: CreateEventTypeUseCase,
    private readonly updateEventTypeUseCase: UpdateEventTypeUseCase,
    private readonly deleteEventTypeUseCase: DeleteEventTypeUseCase,
  ) {}

  @Public()
  @Get()
  findAll() {
    return this.getEventTypesUseCase.execute();
  }

  @Post()
  @Roles('admin', 'marketing')
  create(@Body() dto: CreateEventTypeDto) {
    return this.createEventTypeUseCase.execute(dto);
  }

  @Patch(':id')
  @Roles('admin', 'marketing')
  update(@Param('id') id: string, @Body() dto: UpdateEventTypeDto) {
    return this.updateEventTypeUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'marketing')
  remove(@Param('id') id: string) {
    return this.deleteEventTypeUseCase.execute(id);
  }
}

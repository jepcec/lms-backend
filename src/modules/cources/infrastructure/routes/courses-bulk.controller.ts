import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { ExportCoursesExcelUseCase } from '../../application/use-cases/export-courses-excel.use-case';
import { ExportCoursesJsonUseCase } from '../../application/use-cases/export-courses-json.use-case';
import { ImportCoursesExcelUseCase } from '../../application/use-cases/import-courses-excel.use-case';
import { ImportCoursesJsonUseCase } from '../../application/use-cases/import-courses-json.use-case';
import { CursoParams } from '../../application/dtos/curso-params.dto';

@Controller('courses/bulk')
@Roles('admin', 'soporte')
export class CoursesBulkController {
  constructor(
    private readonly exportExcel: ExportCoursesExcelUseCase,
    private readonly exportJson: ExportCoursesJsonUseCase,
    private readonly importExcel: ImportCoursesExcelUseCase,
    private readonly importJson: ImportCoursesJsonUseCase,
  ) {}

  // Ambas exportaciones reciben los mismos filtros que el listado del panel
  // (search, status, categoria_id, ...) y exportan todos los cursos que los
  // cumplen, sin paginar.
  @Get('export/excel')
  async exportToExcel(@Query() params: CursoParams, @Res() res: any) {
    const response = res as Response;
    const buffer = await this.exportExcel.execute(params);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="cursos-export.xlsx"`,
    );
    response.send(buffer);
  }

  @Get('export/json')
  async exportToJson(@Query() params: CursoParams) {
    return this.exportJson.execute(params);
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    return this.importExcel.execute(file.buffer, userId);
  }

  @Post('import/json')
  async importFromJson(
    @Body() body: any,
    @CurrentUser('userId') userId: string,
  ) {
    return this.importJson.execute(body, userId);
  }
}

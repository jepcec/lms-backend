import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { GetCourseCertificationsUseCase } from '../../application/use-cases/get-course-certifications.use-case';
import { ExportCertificationExcelUseCase } from '../../application/use-cases/export-certification-excel.use-case';
import { ImportCertificationGradesUseCase } from '../../application/use-cases/import-certification-grades.use-case';
import { EmitStudentCertificateUseCase } from '../../application/use-cases/emit-student-certificate.use-case';
import { EmitCertificateDto } from '../../application/dtos/emit-certificate.dto';

@Controller('courses/:courseId/certifications')
@Roles('admin', 'soporte')
export class CertificationsController {
  constructor(
    private readonly getCourseCertifications: GetCourseCertificationsUseCase,
    private readonly exportExcel: ExportCertificationExcelUseCase,
    private readonly importGrades: ImportCertificationGradesUseCase,
    private readonly emitCertificate: EmitStudentCertificateUseCase,
  ) {}

  @Get()
  getCertifications(@Param('courseId') courseId: string) {
    return this.getCourseCertifications.execute(courseId);
  }

  @Get('export')
  async exportToExcel(
    @Param('courseId') courseId: string,
    @Res() res: any,
  ) {
    const response = res as Response;
    const buffer = await this.exportExcel.execute(courseId);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="certificaciones-${courseId}.xlsx"`,
    );
    response.send(buffer);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importGradesFromExcel(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importGrades.execute(courseId, file.buffer);
  }

  @Post('emit')
  emitCert(
    @Param('courseId') courseId: string,
    @Body() body: EmitCertificateDto,
  ) {
    return this.emitCertificate.execute(courseId, body);
  }

  @Delete('emit/:enrollmentId')
  removeCert(
    @Param('courseId') courseId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.emitCertificate.remove(courseId, enrollmentId);
  }
}

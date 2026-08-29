import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { GetMyCertificatesUseCase } from '../../application/use-cases/get-my-certificates.use-case';
import { GetCertificateUseCase } from '../../application/use-cases/get-certificate.use-case';
import { CertificatePdfService } from '../../../cources/application/services/certificate-pdf.service';

@Controller('certificates')
@Roles('estudiante')
export class CertificatesController {
  constructor(
    private readonly getMyCertificatesUseCase: GetMyCertificatesUseCase,
    private readonly getCertificateUseCase: GetCertificateUseCase,
    private readonly pdfService: CertificatePdfService,
  ) {}

  @Get()
  getMyCertificates(@CurrentUser('userId') userId: string) {
    return this.getMyCertificatesUseCase.execute(userId);
  }

  @Get('module/:id/download')
  async downloadModuleCertificate(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Res() res: any,
  ) {
    const response = res as Response;
    const { buffer, filename } =
      await this.pdfService.generateModuleCertificateBuffer(id, userId);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  @Get(':id')
  getCertificate(@Param('id') id: string) {
    return this.getCertificateUseCase.execute(id);
  }

  @Get(':id/download')
  async downloadCertificate(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Res() res: any,
  ) {
    const response = res as Response;
    const { buffer, filename } = await this.pdfService.generateBuffer(
      id,
      userId,
    );
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }
}

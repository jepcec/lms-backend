import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { GetMyCertificatesUseCase } from '../../application/use-cases/get-my-certificates.use-case';
import { GetCertificateUseCase } from '../../application/use-cases/get-certificate.use-case';

@Controller('certificates')
@Roles('estudiante')
export class CertificatesController {
  constructor(
    private readonly getMyCertificatesUseCase: GetMyCertificatesUseCase,
    private readonly getCertificateUseCase: GetCertificateUseCase,
  ) {}

  @Get()
  getMyCertificates(@CurrentUser('userId') userId: string) {
    return this.getMyCertificatesUseCase.execute(userId);
  }

  @Get(':id')
  getCertificate(@Param('id') id: string) {
    return this.getCertificateUseCase.execute(id);
  }
}

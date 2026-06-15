import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { VerifyCertificateUseCase } from '../../application/use-cases/verify-certificate.use-case';

@Controller('certificates')
export class PublicCertificatesController {
  constructor(private readonly verifyUseCase: VerifyCertificateUseCase) {}

  @Get('verify/:code')
  @Public()
  verify(@Param('code') code: string) {
    return this.verifyUseCase.execute(code);
  }
}

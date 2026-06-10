import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Injectable()
export class ListCertificateTemplatesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.certificateTemplate.findMany({
      orderBy: { created_at: 'desc' },
    });
  }
}

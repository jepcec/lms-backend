import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { CertificateTemplateOwnerType } from '../use-cases/certificate-template-key.util';

const OWNER_TYPES: CertificateTemplateOwnerType[] = [
  'course_certificado',
  'course_constancia',
  'module',
];

export class CreateCertificateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(OWNER_TYPES)
  owner_type: CertificateTemplateOwnerType;

  @IsString()
  @IsNotEmpty()
  owner_id: string;

  @IsOptional()
  background_image?: Express.Multer.File;

  @IsOptional()
  back_image?: Express.Multer.File;

  @IsString()
  @IsNotEmpty()
  student_name_position: string;

  @IsString()
  @IsNotEmpty()
  qr_position: string;

  @IsOptional()
  @IsString()
  qr_size?: string; // viene como string desde FormData

  @IsString()
  @IsNotEmpty()
  font_family: string;

  @IsString()
  @IsNotEmpty()
  font_sizes: string;
}

import { IsOptional, IsString } from 'class-validator';

export class UpdateCertificateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  background_image?: Express.Multer.File;

  @IsOptional()
  @IsString()
  student_name_position?: string;

  @IsOptional()
  @IsString()
  qr_position?: string;

  @IsOptional()
  @IsString()
  font_family?: string;

  @IsOptional()
  @IsString()
  font_sizes?: string;
}

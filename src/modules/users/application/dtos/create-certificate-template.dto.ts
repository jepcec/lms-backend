import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCertificateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  background_image?: Express.Multer.File;

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

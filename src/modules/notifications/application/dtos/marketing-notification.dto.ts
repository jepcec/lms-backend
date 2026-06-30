import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetRecipientsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  course_id?: string;
}

export class SendNotificationDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  redirect_url?: string;

  @IsIn(['nuevo_curso', 'descuento', 'anuncio', 'recordatorio'])
  @IsOptional()
  type?: 'nuevo_curso' | 'descuento' | 'anuncio' | 'recordatorio';

  @IsIn(['all', 'course', 'users'])
  audience: 'all' | 'course' | 'users';

  @IsOptional()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  user_ids?: string[];
}

export interface NotificationRecipient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

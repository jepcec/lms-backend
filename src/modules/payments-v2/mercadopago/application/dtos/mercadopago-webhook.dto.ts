import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class MercadoPagoWebhookDataDto {
  @IsOptional()
  @IsString()
  id?: string;
}

export class MercadoPagoWebhookDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data?: MercadoPagoWebhookDataDto;
}

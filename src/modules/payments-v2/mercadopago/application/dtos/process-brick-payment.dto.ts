import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class PayerDto {
  @IsEmail()
  email: string;
}

export class ProcessMercadoPagoBrickDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  payment_method_id: string;

  @IsOptional()
  @IsString()
  issuer_id?: string;

  @IsInt()
  @Min(1)
  installments: number;

  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;
}

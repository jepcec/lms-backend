import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMercadoPagoPreferenceDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePaypalOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

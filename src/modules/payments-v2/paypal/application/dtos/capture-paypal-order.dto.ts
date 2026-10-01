import { IsNotEmpty, IsString } from 'class-validator';

export class CapturePaypalOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paypalOrderId: string;
}

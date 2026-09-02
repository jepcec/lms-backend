import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCulqiChargeDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEmail()
  email: string;
}

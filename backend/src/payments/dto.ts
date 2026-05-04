import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  tcgId!: string;
}

export class CaptureOrderDto {
  @IsString()
  @IsNotEmpty()
  paypalOrderId!: string;
}

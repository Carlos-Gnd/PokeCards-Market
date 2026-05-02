import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  pokemonId!: number;
}

export class CaptureOrderDto {
  @IsString()
  @IsNotEmpty()
  paypalOrderId!: string;
}

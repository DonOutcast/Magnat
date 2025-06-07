import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @IsOptional()
  readonly id?: number;

  @IsString()
  readonly name: string;

  @IsInt()
  readonly minCount: number;

  @IsInt()
  readonly needed: number;

  @IsInt()
  readonly additional: number;

  @IsNumber()
  readonly price: number;
}

export class CreateOrderDto {
  readonly items: OrderItemDto[];
}

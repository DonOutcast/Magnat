import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class ObservableItemDto {
  @IsOptional()
  readonly id?: number;

  @IsInt()
  readonly productId: number;

  @IsInt()
  readonly packing: number;

  @IsString()
  readonly packingType: string;
}

export class CreateObservableDto {
  @IsInt()
  readonly supplierId: number;

  @IsString({ message: 'Должно быть строкой' })
  readonly name: string;

  @IsNumber()
  readonly price: number;

  @IsInt()
  readonly minCount: number;

  readonly items: ObservableItemDto[];
}

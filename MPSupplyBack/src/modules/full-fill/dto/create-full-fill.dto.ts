import { IsInt } from 'class-validator';

export class FullFillItemDto {
  @IsInt()
  readonly obsItemId: number;

  readonly stock: {
    readonly whName: number;
    readonly qty: number;
  }[];
}

export class CreateFullFillDto {
  readonly mp: string;
  readonly items: FullFillItemDto[];
  readonly liters: number;
  readonly boxes: number;
  readonly pallets: number;
}

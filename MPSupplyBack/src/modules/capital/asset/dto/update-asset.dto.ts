import { IsNumber } from 'class-validator';

export class UpdateAssetDto {
  @IsNumber()
  readonly amount: number;
}

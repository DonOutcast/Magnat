import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseDto } from './create-warehouse.dto';
import { IsBoolean, IsInt, IsString } from 'class-validator';

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {
  @IsString()
  readonly shortName: string;

  @IsBoolean()
  readonly visible: boolean;

  @IsInt()
  readonly priority: number;

  @IsInt()
  readonly periodStock: number;

  @IsInt()
  readonly periodDelivery: number;
}

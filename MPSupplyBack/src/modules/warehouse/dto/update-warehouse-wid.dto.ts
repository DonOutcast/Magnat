import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt } from 'class-validator';
import { UpdateWarehouseDto } from './update-warehouse.dto';

export class UpdateWarehouseWithIdDto extends PartialType(UpdateWarehouseDto) {
    @IsInt()
    readonly id: number;
}

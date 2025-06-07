import { PartialType } from '@nestjs/swagger';
import { CreateLiabilityDto } from './create-liability.dto';
import { IsNumber } from 'class-validator';

export class UpdateLiabilityDto extends PartialType(CreateLiabilityDto) {
  @IsNumber()
  readonly id: number;
}

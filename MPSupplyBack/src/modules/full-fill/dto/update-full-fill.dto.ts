import { PartialType } from '@nestjs/swagger';
import { CreateFullFillDto } from './create-full-fill.dto';

export class UpdateFullFillDto extends PartialType(CreateFullFillDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateObservableDto } from './create-observable.dto';

export class UpdateObservableDto extends PartialType(CreateObservableDto) {}

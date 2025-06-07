import { IsDate, IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateLiabilityDto {
  @IsString({ message: 'Должно быть строкой' })
  readonly name: string;

  @IsString({ message: 'Должно быть строкой' })
  readonly doc_number: string;

  @IsNumber()
  readonly amount: number;

  @IsDateString()
  readonly doc_date_start: string;

  @IsNumber()
  readonly pay_main: number;

  @IsNumber()
  readonly pay_percent: number;

  @IsDateString()
  readonly doc_date_closest: string;

  @IsNumber()
  readonly pay_main_after: number;
}

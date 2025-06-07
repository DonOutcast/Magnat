import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateSupplierDto {
  @ApiProperty({ example: 'Аурус', description: 'Наименование поставщика' })
  @IsString({ message: 'Наименование поставщика быть строкой' })
  readonly name: string;
}

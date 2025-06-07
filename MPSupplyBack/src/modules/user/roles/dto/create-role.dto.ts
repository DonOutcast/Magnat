import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'manager', description: 'Slug роли' })
  @IsString({ message: 'Должно быть строкой' })
  readonly slug: string;

  @ApiProperty({ example: 'Администратор точки', description: 'Описание роли' })
  @IsString({ message: 'Должно быть строкой' })
  readonly desc: string;
}

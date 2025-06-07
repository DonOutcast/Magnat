import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddRoleDto {
  @ApiProperty({ example: 'manager', description: 'Slug роли' })
  @IsString({ message: 'Должно быть строкой' })
  readonly slug: string;
}

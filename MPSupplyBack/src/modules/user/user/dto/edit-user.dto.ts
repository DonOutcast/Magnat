import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: '79991850118', description: 'Телефон' })
  @IsString({ message: 'Должно быть строкой' })
  @Transform(({ value }) => {
    return value.replace(/[^0-9]/g, '');
  })
  @Length(11, 11, { message: 'Номер телефона должен содержать 11 цифр' })
  readonly phone: string;

  @ApiProperty({ example: 'ХБА', description: 'ФИО' })
  @IsString({ message: 'Должно быть строкой' })
  readonly fio: string;

  @ApiProperty({ example: '123456', description: 'Новый пароль' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 16, { message: 'Не меньше 6 и не больше 16 символов' })
  @IsOptional()
  readonly newpass?: string;

  @ApiProperty({ example: [1, 3], description: 'Список ролей' })
  @IsOptional()
  readonly selectedRoles?: number[];
}

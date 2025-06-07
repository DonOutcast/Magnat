import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class AuthUserDto {
  @ApiProperty({ example: '79991850118', description: 'Телефон' })
  @IsString({ message: 'Должно быть строкой' })
  @Transform(({ value }) => {
    return value.replace(/[^0-9]/g, '');
  })
  @Length(11, 11, { message: 'Номер телефона представителя должен содержать 11 цифр' })
  readonly phone: string;

  @ApiProperty({ example: '123456', description: 'Пароль' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 16, { message: 'Не меньше 6 и не больше 16 символов' })
  readonly password: string;
}

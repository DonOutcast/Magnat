import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty({ example: '.....', description: 'JWT Token' })
  token: string;
}

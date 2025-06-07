import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class SearchPaginationDto extends PartialType(PaginationDto) {
  @ApiProperty({ example: '...', description: 'Поиск' })
  @IsString({ message: 'Поиск быть строкой' })
  @IsOptional()
  search?: string;
}

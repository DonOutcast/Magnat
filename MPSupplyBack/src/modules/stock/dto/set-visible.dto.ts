import { IsBoolean, IsString } from 'class-validator';

export class SetVisibleDto {
  @IsString({ message: 'Должно быть строкой' })
  readonly warehouse_name: string;

  @IsString({ message: 'Должно быть строкой' })
  readonly productId: string;

  @IsBoolean()
  readonly visible: boolean;
}

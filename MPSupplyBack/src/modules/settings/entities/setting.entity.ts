import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'settings', timestamps: false })
export class Setting extends Model<Setting> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'Payments', description: 'Модуль' })
  @Column({ type: DataType.STRING })
  module: string;

  @ApiProperty({ example: 'cashbox', description: 'Код параметра' })
  @Column({ type: DataType.STRING })
  code: string;

  @ApiProperty({ example: '100500', description: 'Значение параметра JSON' })
  @Column({ type: DataType.JSON })
  value: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum SettingF {
  ID = 'id',
  MODULE = 'module',
  CODE = 'code',
  VALUE = 'value',
  CID = 'cid',
}

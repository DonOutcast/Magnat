import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'cabinet' })
export class Cabinet extends Model<Cabinet> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '', description: 'Наименование' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: true, description: 'Наименование' })
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @ApiProperty({ example: '', description: 'Значение параметра JSON' })
  @Column({ type: DataType.JSON })
  syncData: any;
}

export enum CabinetF {
  ID = 'id',
  NAME = 'name',
  IS_ACTIVE = 'isActive',
  SYNC_DATA = 'syncData',
}

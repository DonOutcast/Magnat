import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'capital_asset' })
export class CapitalAsset extends Model<CapitalAsset> {
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

  @ApiProperty({ example: '', description: 'Наименование' })
  @Column({ type: DataType.STRING })
  type: string;

  @ApiProperty({ example: 0, description: 'Наименование' })
  @Column({ type: DataType.DOUBLE })
  amount: number;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum CapitalAssetF {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
  AMOUNT = 'amount',
  CID = 'cid',
}

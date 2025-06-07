import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'warehouses', timestamps: false })
export class Warehouse extends Model<Warehouse> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.BIGINT,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'МО Хоругвино РФЦ',
    description: 'Наименование склада',
  })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: 'ХОР', description: 'Короткое наименование' })
  @Column({ type: DataType.STRING })
  shortName: string;

  @ApiProperty({ example: 1, description: 'Приориет склада' })
  @Column({ type: DataType.INTEGER })
  priority: number;

  @ApiProperty({ example: true, description: 'Видимость склада' })
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  visible: boolean;

  @ApiProperty({ example: 15, description: 'Период запаса (дней)' })
  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  periodStock: number;

  @ApiProperty({ example: 8, description: 'Период доставки (дней)' })
  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  periodDelivery: number;

  @Column({ type: DataType.BIGINT })
  cid: number;

  @ApiProperty({ example: 'ozon', description: 'Marketplace (ozon|wb)' })
  @Column({ type: DataType.STRING })
  mp: string;
}

export enum WarehouseF {
  ID = 'id',
  NAME = 'name',
  SHORT_NAME = 'shortName',
  PRIORITY = 'priority',
  VISIBLE = 'visible',
  PERIOD_STOCK = 'periodStock',
  PERIOD_DELIVERY = 'periodDelivery',
  CID = 'cid',
  MP = 'mp',
}

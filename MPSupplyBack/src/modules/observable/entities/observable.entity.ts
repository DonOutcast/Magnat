import { ApiProperty } from '@nestjs/swagger';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { ObservableItem } from './observable-item.entity';
import { Supplier } from 'src/modules/supplier/entities/supplier.entity';

@Table({ tableName: 'оbservable', timestamps: false })
export class Observable extends Model<Observable> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @BelongsTo(() => Supplier)
  supplier: Supplier;

  @ForeignKey(() => Supplier)
  @ApiProperty({ example: 1, description: 'ID поставщика' })
  @Column({ type: DataType.INTEGER })
  supplierId: number;

  @ApiProperty({ example: '', description: 'Наименование' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: 1, description: 'Цена' })
  @Column({ type: DataType.DOUBLE })
  price: number;

  @ApiProperty({ example: 1, description: 'Кратность поставки' })
  @Column({ type: DataType.INTEGER })
  minCount: number;

  @HasMany(() => ObservableItem)
  items: ObservableItem[];

  @ApiProperty({ example: 1, description: 'Необходимо' })
  @Column({ type: DataType.INTEGER })
  need: number;

  @ApiProperty({ example: 1, description: 'Необходимо кратно поставке' })
  @Column({ type: DataType.INTEGER })
  needmin: number;

  @ApiProperty({ example: 1, description: 'Текущие остатки на ФФ' })
  @Column({ type: DataType.INTEGER })
  inOurStock: number;

  @ApiProperty({ example: 1, description: 'Необходимый запас на ФФ' })
  @Column({ type: DataType.INTEGER })
  stockReserve: number;

  @ApiProperty({ example: 1, description: 'В пути' })
  @Column({ type: DataType.INTEGER })
  inWay: number;

  @ApiProperty({ example: 1, description: 'Итого необходимо' })
  @Column({ type: DataType.INTEGER })
  totalNeed: number;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum ObservableF {
  ID = 'id',
  SUPPLIER_ID = 'supplierId',
  NAME = 'name',
  PRICE = 'price',
  MIN_COUNT = 'minCount',
  NEED = 'need',
  NEED_MIN = 'needmin',
  IN_OUR_STOCK = 'inOurStock',
  STOCK_RESERVE = 'stockReserve',
  IN_WAY = 'inWay',
  TOTAL_NEED = 'totalNeed',
  CID = 'cid',
}

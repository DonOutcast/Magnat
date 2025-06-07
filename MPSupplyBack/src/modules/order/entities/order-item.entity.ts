import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Order } from './order.entity';
import { Supplier } from 'src/modules/supplier/entities/supplier.entity';

@Table({ tableName: 'order_item', timestamps: false })
export class OrderItem extends Model<OrderItem> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @BelongsTo(() => Order)
  order: Order;

  @ForeignKey(() => Order)
  @ApiProperty({ example: 1, description: 'ID заказа' })
  @Column({ type: DataType.BIGINT })
  orderId: number;

  @BelongsTo(() => Supplier)
  supplier: Supplier;

  @ForeignKey(() => Supplier)
  @ApiProperty({ example: 1, description: 'ID поставщика' })
  @Column({ type: DataType.BIGINT })
  supplierId: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.INTEGER })
  minCount: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.INTEGER })
  needed: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.INTEGER })
  additional: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.DOUBLE })
  price: number;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum OrderItemF {
  ID = 'id',
  ORDER_ID = 'orderId',
  SUPPLIER_ID = 'supplierId',
  NAME = 'name',
  MIN_COUNT = 'minCount',
  NEEDED = 'needed',
  ADDITIONAL = 'additional',
  PRICE = 'price',
  CID = 'cid',
}

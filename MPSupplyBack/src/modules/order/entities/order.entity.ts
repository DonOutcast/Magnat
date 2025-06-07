import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

@Table({ tableName: 'order' })
export class Order extends Model<Order> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @HasMany(() => OrderItem)
  items: OrderItem[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  approved: boolean;

  @Column({ type: DataType.STRING })
  ts: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum OrderF {
  ID = 'id',
  TS = 'ts',
  CID = 'cid',
  APPROVED = 'approved',
}

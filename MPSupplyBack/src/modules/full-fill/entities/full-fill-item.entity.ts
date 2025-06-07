import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { FullFill } from './full-fill.entity';
import { ObservableItem } from 'src/modules/observable/entities/observable-item.entity';
import { Observable } from 'src/modules/observable/entities/observable.entity';

@Table({ tableName: 'fullfill_item' })
export class FullFillItem extends Model<FullFillItem> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @BelongsTo(() => FullFill)
  order: FullFill;

  @ForeignKey(() => FullFill)
  @ApiProperty({ example: 1, description: 'ID заказа' })
  @Column({ type: DataType.BIGINT })
  orderId: number;

  @BelongsTo(() => ObservableItem)
  obsItem: ObservableItem;

  @ForeignKey(() => ObservableItem)
  @ApiProperty({ example: 1, description: 'ID заказа' })
  @Column({ type: DataType.BIGINT })
  obsItemId: number;

  @Column({ type: DataType.INTEGER })
  qty: number;

  @Column({ type: DataType.JSONB })
  stock: any;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum FullFillItemF {
  ID = 'id',
  ORDER_ID = 'orderId',
  OBS_ITEM_ID = 'obsItemId',
  QTY = 'qty',
  STOCK = 'stock',
  CID = 'cid',
}

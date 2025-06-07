import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { FullFillItem } from './full-fill-item.entity';

@Table({ tableName: 'fullfill' })
export class FullFill extends Model<FullFill> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @HasMany(() => FullFillItem)
  items: FullFillItem[];

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  liters: number;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  boxes: number;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  pallets: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  approved: boolean;

  @Column({ type: DataType.BIGINT })
  cid: number;

  @Column({ type: DataType.JSONB })
  inDeliveryWarehouses: any;

  @Column({ type: DataType.STRING })
  mp: string;
}

export enum FullFillF {
  ID = 'id',
  LITERS = 'liters',
  BOXES = 'boxes',
  PALLETS = 'pallets',
  APPROVED = 'approved',
  CID = 'cid',
  MP = 'mp',
}

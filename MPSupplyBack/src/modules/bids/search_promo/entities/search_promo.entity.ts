import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'bids_search_promo', timestamps: false })
export class SearchPromo extends Model<SearchPromo> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING })
  sku: string;

  @Column({ type: DataType.STRING })
  offerId: string;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.STRING })
  category: string;

  @Column({ type: DataType.STRING })
  promotion_status: string;

  @Column({ type: DataType.FLOAT })
  price: number;

  @Column({ type: DataType.FLOAT })
  bid: number;

  @Column({ type: DataType.FLOAT })
  bidValue: number;

  @Column({ type: DataType.INTEGER })
  orders: number;

  @Column({ type: DataType.FLOAT })
  ordersMoney: number;

  @Column({ type: DataType.FLOAT })
  moneySpent: number;

  @Column({ type: DataType.FLOAT })
  drr: number;

  @Column({ type: DataType.FLOAT })
  coverage: number;

  @Column({ type: DataType.INTEGER })
  views: number;

  @Column({ type: DataType.INTEGER })
  clicks: number;

  @Column({ type: DataType.FLOAT })
  ctr: number;

  @Column({ type: DataType.INTEGER })
  toCart: number;

  @Column({ type: DataType.DATEONLY })
  date: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum SearchPromoF {
  ID = 'id',
  CID = 'cid',
  MP = 'mp',
}

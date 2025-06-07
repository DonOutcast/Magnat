import { ApiProperty } from '@nestjs/swagger';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Product } from 'src/modules/product/entities/product.entity';

@Table({ tableName: 'stock', timestamps: false })
export class Stock extends Model<Stock> {
  @ApiProperty({ example: 353985714, description: 'ID' })
  @Column({
    type: DataType.BIGINT,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @BelongsTo(() => Product)
  product: Product;

  @ForeignKey(() => Product)
  @ApiProperty({ example: 1, description: '' })
  @Column({ type: DataType.BIGINT })
  productId: number;

  @ApiProperty({
    example: 'МО Хоругвино РФЦ',
    description: 'Наименование склада',
  })
  @Column({ type: DataType.STRING })
  warehouse_name: string;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.INTEGER })
  promised_amount: number;

  @ApiProperty({ example: 15, description: '' })
  @Column({ type: DataType.INTEGER })
  free_to_sell_amount: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.INTEGER })
  reserved_amount: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.INTEGER })
  delivering_amount: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  avg_sale: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  needed: number;

  @ApiProperty({ example: true, description: 'Видимость склада' })
  @Column({ type: DataType.BOOLEAN })
  visible: boolean;

  @Column({ type: DataType.BIGINT })
  cid: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.INTEGER })
  maxAmount: number;

  @ApiProperty({ example: 0, description: '' })
  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  maxSale: number;
}

export enum StockF {
  ID = 'id',
  PRODUCT_ID = 'productId',
  WAREOUSE_NAME = 'warehouse_name',
  PROMISED_AMOUNT = 'promised_amount',
  FREE_AMOUNT = 'free_to_sell_amount',
  RESERVED_AMOUNT = 'reserved_amount',
  DELIVERING_AMOUNT = 'delivering_amount',
  AVG_SALE = 'avg_sale',
  NEEDED = 'needed',
  VISIBLE = 'visible',
  CID = 'cid',
  MAX_AMOUNT = 'maxAmount',
  MAX_SALE = 'maxSale',
}

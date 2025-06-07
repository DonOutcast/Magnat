import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Stock } from 'src/modules/stock/entities/stock.entity';

@Table({ tableName: 'products', timestamps: false })
export class Product extends Model<Product> {
  @ApiProperty({ example: 353985714, description: 'ID' })
  @Column({
    type: DataType.BIGINT,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ApiProperty({
    example:
      'Шприц медицинский 5 мл для инъекций с иглой LUER, стерильный одноразовый (30 штук)',
    description: 'Наименование склада',
  })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({
    example: 694757807,
    description: 'Идентификатор товара в другой системе',
  })
  @Column({ type: DataType.BIGINT })
  foreignId: number;

  @ApiProperty({
    example: 694757807,
    description: 'SKU товара в другой системе',
  })
  @Column({ type: DataType.BIGINT })
  sku: number;

  @ApiProperty({ example: '30шп5мл', description: 'Артикул' })
  @Column({ type: DataType.STRING })
  offer_id: string;

  @ApiProperty({ example: 'OZN694757807', description: 'Штрихкод' })
  @Column({ type: DataType.STRING })
  barcode: string;

  @ApiProperty({ example: 3.17, description: 'Объем в л.' })
  @Column({ type: DataType.FLOAT })
  volume: number;

  @HasMany(() => Stock)
  stock: Stock[];

  @ApiProperty({ example: false, description: 'В архиве' })
  @Column({ type: DataType.BOOLEAN })
  inArchive: boolean;

  @Column({ type: DataType.BIGINT })
  cid: number;

  @ApiProperty({ example: 'ozon', description: 'Marketplace (ozon|wb)' })
  @Column({ type: DataType.STRING })
  mp: string;
}

export enum ProductF {
  ID = 'id',
  NAME = 'name',
  FOREIGN_ID = 'foreignId',
  SKU = 'sku',
  OFFER_ID = 'offer_id',
  BARCODE = 'barcode',
  VOLUME = 'volume',
  IN_ARCHIVE = 'inArchive',
  CID = 'cid',
  MP = 'mp',
  STOCK = 'stock',
}

import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from 'src/modules/product/entities/product.entity';

@Table({ tableName: 'sale', timestamps: false })
export class Sale extends Model<Sale> {
  @ApiProperty({ example: 1, description: '' })
  @Column({ type: DataType.DATE })
  created_at: string;

  @BelongsTo(() => Product)
  product: Product;

  @ForeignKey(() => Product)
  @ApiProperty({ example: 1, description: '' })
  @Column({ type: DataType.BIGINT })
  productId: number;

  @ApiProperty({ example: 15, description: '' })
  @Column({ type: DataType.INTEGER })
  qty: number;

  @ApiProperty({
    example: 'МО Хоругвино РФЦ',
    description: 'Наименование склада',
  })
  @Column({ type: DataType.STRING })
  warehouse: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum SaleF {
  CREATED_AT = 'created_at',
  PRODUCT_ID = 'productId',
  QTY = 'qty',
  WAREHOUSE = 'warehouse',
  CID = 'cid',
}

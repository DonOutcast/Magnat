import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Observable } from './observable.entity';
import { Product } from 'src/modules/product/entities/product.entity';

@Table({ tableName: 'оbservable_items', timestamps: false })
export class ObservableItem extends Model<ObservableItem> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @BelongsTo(() => Observable)
  observable: Observable;

  @ForeignKey(() => Observable)
  @ApiProperty({ example: 1, description: 'ID заказа' })
  @Column({ type: DataType.BIGINT })
  observableId: number;

  @BelongsTo(() => Product)
  product: Product;

  @ForeignKey(() => Product)
  @ApiProperty({ example: 1, description: 'ID заказа' })
  @Column({ type: DataType.BIGINT })
  productId: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.INTEGER })
  packing: number;

  @ApiProperty({ example: 'ПВД', description: 'Фасовка' })
  @Column({ type: DataType.STRING })
  packingType: string;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.INTEGER })
  needed: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.FLOAT })
  avgSale: number;

  @ApiProperty({ example: 1, description: 'Фасовка' })
  @Column({ type: DataType.STRING })
  barcodePath: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum ObservableItemF {
  ID = 'id',
  OBSERVABLE_ID = 'observableId',
  PRODUCT_ID = 'productId',
  PACKING = 'packing',
  PACKING_TYPE = 'packingType',
  NEEDED = 'needed',
  AVG_SALE = 'avgSale',
  BARCODE_PATH = 'barcodePath',
  CID = 'cid',
}

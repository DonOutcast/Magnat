import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Observable } from 'src/modules/observable/entities/observable.entity';

@Table({ tableName: 'suppliers', timestamps: false })
export class Supplier extends Model<Supplier> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'Аурус', description: 'Наименование поставщика' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: new Date(), description: 'Дата удаления' })
  @DeletedAt
  deletedAt: Date;

  @HasMany(() => Observable)
  observables: Observable[];

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum SupplierF {
  ID = 'id',
  NAME = 'name',
  DELETED_AT = 'deletedAt',
  CID = 'cid',
}

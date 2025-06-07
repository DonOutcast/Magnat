import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'bids_campaing' })
export class Campaing extends Model<Campaing> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.BIGINT })
  campaingId: number;

  @Column({ type: DataType.STRING })
  paymentType: string;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.STRING })
  state: string;

  @Column({ type: DataType.STRING })
  advObjectType: string;

  @Column({ type: DataType.STRING })
  fromDate: string;

  @Column({ type: DataType.STRING })
  toDate: string;

  @Column({ type: DataType.INTEGER })
  dailyBudget: number;

  @Column({ type: DataType.INTEGER })
  budget: number;

  @Column({ type: DataType.BIGINT })
  cid: number;

  @ApiProperty({ example: 'ozon', description: 'Marketplace (ozon|wb)' })
  @Column({ type: DataType.STRING })
  mp: string;
}

export enum CampaingF {
  ID = 'id',
  CAMPAING_ID = 'campaingId',
  PAYMENT_TYPE = 'paymentType',
  TITLE = 'title',
  STATE = 'state',
  ADV_OBJECT_TYPE = 'advObjectType',
  FROM_DATE = 'fromDate',
  TO_DATE = 'toDate',
  DAYLY_BUDGET = 'dailyBudget',
  BUDGET = 'budget',
  CID = 'cid',
  MP = 'mp',
}

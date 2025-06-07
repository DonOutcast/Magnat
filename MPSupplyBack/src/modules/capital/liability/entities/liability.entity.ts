import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'capital_liability' })
export class CapitalLiability extends Model<CapitalLiability> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '', description: 'Тип займа' })
  @Column({ type: DataType.STRING })
  name: string;

  @ApiProperty({ example: 0, description: 'Номер договора' })
  @Column({ type: DataType.STRING })
  doc_number: string;

  @ApiProperty({ example: 0, description: 'Сумма займа' })
  @Column({ type: DataType.DOUBLE })
  amount_init: number;

  @ApiProperty({ example: 0, description: 'Остаток по ОД' })
  @Column({ type: DataType.DOUBLE })
  amount: number;

  @ApiProperty({ example: 0, description: 'Дата займа' })
  @Column({ type: DataType.DATEONLY })
  doc_date_start: string;

  @ApiProperty({ example: 0, description: 'Платеж по ОД' })
  @Column({ type: DataType.DOUBLE })
  pay_main: number;

  @ApiProperty({ example: 0, description: 'Платеж процентов' })
  @Column({ type: DataType.DOUBLE })
  pay_percent: number;

  @ApiProperty({ example: 0, description: 'Дата платежа' })
  @Column({ type: DataType.DATEONLY })
  doc_date_closest: string;

  @Column({ type: DataType.BIGINT })
  cid: number;
}

export enum CapitalLiabilityF {
  ID = 'id',
  NAME = 'name',
  DOC_NUMBER = 'doc_number',
  AMOUNT_INIT = 'amount_init',
  AMOUNT = 'amount',
  DOC_DATE_START = 'doc_date_start',
  PAY_MAIN = 'pay_main',
  PAY_PERCENT = 'pay_percent',
  DOC_DATE_CLOSEST = 'doc_date_closest',
  CID = 'cid',
}

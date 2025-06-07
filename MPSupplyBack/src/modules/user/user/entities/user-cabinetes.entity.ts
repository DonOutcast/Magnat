import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Cabinet } from 'src/modules/cabinet/entities/cabinet.entity';
import { User } from 'src/modules/user/user/entities/user.entity';

@Table({ tableName: 'user_cabinetes', createdAt: false, updatedAt: false })
export class UserCabinetes extends Model<UserCabinetes> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Cabinet)
  @Column({ type: DataType.NUMBER })
  cabinetId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.NUMBER })
  userId: number;
}

export enum UserCabinetesField {
  ID = 'id',
  CABINET_ID = 'cabinetId',
  USER_ID = 'userId',
}

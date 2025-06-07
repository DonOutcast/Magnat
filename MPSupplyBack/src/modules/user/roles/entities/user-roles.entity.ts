import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/modules/user/user/entities/user.entity';
import { Role } from './role.entity';

@Table({ tableName: 'user_roles', createdAt: false, updatedAt: false })
export class UserRoles extends Model<UserRoles> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Role)
  @Column({ type: DataType.NUMBER })
  roleId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.NUMBER })
  userId: number;
}

export enum UserRolesF {
  ID = 'id',
  ROLE_ID = 'roleId',
  USER_ID = 'userId',
}

import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserRoles } from '../../roles/entities/user-roles.entity';
import { Role } from '../../roles/entities/role.entity';
import { Cabinet } from 'src/modules/cabinet/entities/cabinet.entity';
import { UserCabinetes } from './user-cabinetes.entity';

interface UserCreationAttrs {
  phone: string;
  password: string;
  fio: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: '79991850118', description: 'Телефон' })
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  phone: string;

  @ApiProperty({
    example: 'hashHASHhashHASHhashHASHhashHASHhashHASH',
    description: 'Пароль',
  })
  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @ApiProperty({ example: 'Иванов Иван', description: 'ФИО' })
  @Column({ type: DataType.STRING })
  fio: string;

  @ApiProperty({ example: true, description: 'Активность аккаунта' })
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  active: boolean;

  @ApiProperty({ example: 'success', description: 'Класс (цвет) пользователя' })
  @Column({ type: DataType.STRING })
  class: string;

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @Column({ type: DataType.BIGINT })
  cid: number;

  @BelongsToMany(() => Cabinet, () => UserCabinetes)
  cabinetes: Cabinet[];
}

export class UserWithAcccesses extends User {
  accesses: string[];
}

export enum UserF {
  PHONE = 'phone',
  PASSWORD = 'password',
  FIO = 'fio',
  ACTIVE = 'active',
  CLASS = 'class',
  ROLES = 'roles',
  CID = 'cid',
  CABINETES = 'cabinetes',
}

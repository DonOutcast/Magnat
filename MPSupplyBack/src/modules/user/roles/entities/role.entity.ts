import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/modules/user/user/entities/user.entity';
import { UserRoles } from './user-roles.entity';

interface RoleCreationAttrs {
  slug: string;
  desc: string;
}

@Table({ tableName: 'roles' })
export class Role extends Model<Role, RoleCreationAttrs> {
  @ApiProperty({ example: 1, description: 'ID' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({ example: 'manager', description: 'Slug роли' })
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  slug: string;

  @ApiProperty({ example: 'Администратор точки', description: 'Описание роли' })
  @Column({ type: DataType.STRING, allowNull: false })
  desc: string;

  @BelongsToMany(() => User, () => UserRoles)
  users: User[];
}

export enum RoleF {
  ID = 'id',
  SLUG = 'slug',
  DESC = 'desc',
}

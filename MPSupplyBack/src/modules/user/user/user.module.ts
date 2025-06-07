import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { RolesModule } from 'src/modules/user/roles/roles.module';
import { Role } from '../roles/entities/role.entity';
import { UserRoles } from '../roles/entities/user-roles.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [SequelizeModule.forFeature([User, Role, UserRoles]), RolesModule, forwardRef(() => AuthModule)],
  exports: [UserService],
})
export class UserModule {}

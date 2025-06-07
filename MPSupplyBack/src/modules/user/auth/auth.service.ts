import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from 'src/modules/user/user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(userDto: AuthUserDto) {
    const user = await this.validateUser(userDto);

    const accesses = [];
    // TODO: Repo access
    if (user.roles.some((role) => role.slug == 'admin')) {
      accesses.push(
        'orders',
        'own_calendar',
        'all_calendar',
        'clients',
        'service_manage',
        'own_zp',
        'all_zp',
        'schedule',
        'stat',
        'warehouse',
        'delete_order',
        'roles',
        'users',
        'warehouse_edit',
        'payment_edit',
      );
    }
    if (user.roles.some((role) => role.slug == 'manager')) {
      accesses.push('orders', 'own_calendar', 'all_calendar', 'clients', 'own_zp', 'schedule', 'warehouse');
    }
    if (user.roles.some((role) => role.slug == 'master')) {
      accesses.push('own_calendar', 'own_zp');
    }

    if (user.id == 10) {
      accesses.push('all_zp');
    }

    user.dataValues['accesses'] = accesses;

    return { ...this.generateToken(user), user };
  }

  async reg(userDto: CreateUserDto) {
    const exists = await this.userService.getByPhone(userDto.phone);

    if (exists) {
      throw new HttpException('Пользователь с таким телефоном уже существует', HttpStatus.BAD_REQUEST);
    }

    const password = await bcrypt.hash(userDto.password, 4);
    const user = await this.userService.createUser({
      ...userDto,
      password: password,
    });
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = {
      id: user.id,
      phone: user.phone,
      fio: user.fio,
      roles: user.roles,
      cid: user.cid,
      cabinetes: user.cabinetes,
    };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(userDto: AuthUserDto) {
    const user = await this.userService.getByPhone(userDto.phone);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Некорректный телефон или пароль',
      });
    }
    const passwordEquals = await bcrypt.compare(userDto.password, user.password);
    if (user && passwordEquals) {
      return user;
    }
    throw new UnauthorizedException({
      message: 'Некорректный телефон или пароль',
    });
  }

  public async amIAuth(user: User) {
    if ('cabinetes' in user) {
      user.cabinetes = (await this.userService.get(user.id)).cabinetes;
      return user;
    }
    return user;
  }

  public async setCabinet(userId: number, cabinetId: number) {
    const user = await this.userService.setCid(userId, cabinetId);
    return this.generateToken(user);
  }
}

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from 'src/modules/user/roles/roles.service';
import { UpdateUserDto } from './dto/edit-user.dto';
import * as bcrypt from 'bcryptjs';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private roleService: RolesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async createUser(dto: CreateUserDto) {
    const exists = await this.getByPhone(dto.phone);

    if (exists) {
      throw new HttpException(
        'Пользователь с такими телефоном уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 4),
    });
    const role = await this.roleService.getBySlug(dto.role);
    await user.$set('roles', [role.id]);
    user.roles = [role];

    return user;
  }

  async getAll() {
    const users = await this.userRepository.findAll({
      include: { all: true },
      order: [['fio', 'ASC']],
    });
    return users;
  }

  async getAllActive() {
    const users = await this.userRepository.findAll({
      include: { all: true },
      order: [['fio', 'ASC']],
      where: { active: true },
    });
    return users;
  }

  async getAllMasters() {
    const users = await this.userRepository.findAll({
      where: { active: true },
      attributes: ['id', 'fio'],
      include: { model: Role, where: { slug: 'master' }, attributes: [] },
      order: [['fio', 'ASC']],
    });
    return users;
  }

  async getByPhone(phone: string) {
    const user = await this.userRepository.findOne({
      where: { phone },
      include: { all: true },
    });

    return user;
  }

  async get(id: number) {
    const user = await this.userRepository.findByPk(id, {
      include: { all: true },
    });

    user.dataValues['allRoles'] = await this.roleService.findAll();

    return user;
  }

  async addRole(id: number, slug: string) {
    const user = await this.get(id);
    const role = await this.roleService.getBySlug(slug);

    if (!user || !role) {
      throw new HttpException(
        'Пользователь или роль не найдены',
        HttpStatus.NOT_FOUND,
      );
    }

    user.$add('roles', role.id);

    return user;
  }
  async edit(id: number, dto: UpdateUserDto) {
    const user = await this.get(id);

    if (user) {
      user.update({
        phone: dto.phone,
        fio: dto.fio,
      });

      if (dto.newpass && dto.newpass.length >= 6) {
        user.update({
          password: await bcrypt.hash(dto.newpass, 4),
        });
      }

      if (dto.selectedRoles) {
        user.$set('roles', dto.selectedRoles);
      }
    }
  }

  async deactivate(id: number) {
    const user = await this.get(id);

    if (user) {
      user.update({
        active: false,
        password: '',
      });
    }
  }

  async setCid(userId: number, cabinetId: number) {
    const user = await this.get(userId);
    // TODO: check trought
    user.cid = cabinetId;
    await user.save();

    return user;
  }
}

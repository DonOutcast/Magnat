import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.create(createRoleDto);
    return role;
  }

  async findAll() {
    return await this.roleRepository.findAll();
  }

  async findOne(id: number) {
    return await this.roleRepository.findByPk(id, { include: { all: true } });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const [, [updatedData]] = await this.roleRepository.update({ ...updateRoleDto }, { where: { id: id }, returning: true });

    return updatedData;
  }

  async getBySlug(slug: string) {
    return await this.roleRepository.findOne({ where: { slug } });
  }
}

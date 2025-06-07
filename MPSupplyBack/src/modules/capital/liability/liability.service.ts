import { Injectable } from '@nestjs/common';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { CapitalLiability, CapitalLiabilityF } from './entities/liability.entity';
import { InjectModel } from '@nestjs/sequelize';
import { ORDERBY } from 'src/main.types';

@Injectable()
export class LiabilityService {
  constructor(@InjectModel(CapitalLiability) private liabilityRepository: typeof CapitalLiability) {}

  async create(dto: CreateLiabilityDto, cid: number) {
    return await this.liabilityRepository.create({
      ...dto,
      cid,
    });
  }

  async findAll(cid: number) {
    return await this.liabilityRepository.findAll({ where: { cid }, order: [[CapitalLiabilityF.AMOUNT, ORDERBY.DESC]] });
  }

  async findOne(id: number, cid: number) {
    return await this.liabilityRepository.findOne({ where: { id, cid } });
  }

  async update(id: number, dto: UpdateLiabilityDto, cid: number) {
    const [, [updatedData]] = await this.liabilityRepository.update({ ...dto }, { where: { id, cid }, returning: true });

    return updatedData;
  }

  async remove(id: number, cid: number) {
    return await this.liabilityRepository.destroy({ where: { id, cid } });
  }
}

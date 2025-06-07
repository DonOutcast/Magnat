import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Supplier } from './entities/supplier.entity';
import { Op } from 'sequelize';
import { SearchPaginationDto } from 'src/dto/search-pagination.dto';
import { ORDERBY } from 'src/main.types';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier) private supplierRepository: typeof Supplier,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, cid: number) {
    return await this.supplierRepository.create({
      ...createSupplierDto,
      cid,
    });
  }

  async findAll(dto: SearchPaginationDto, cid: number) {
    const whereParams = { cid };

    if (dto.search) {
      whereParams['name'] = { [Op.iLike]: '%' + dto.search.trim() + '%' };
    }

    return await this.supplierRepository
      .findAndCountAll({
        limit: dto.limit,
        offset: (dto.page - 1) * dto.limit,
        order: [['id', ORDERBY.DESC]],
        where: whereParams,
      })
      .then((res) => {
        return {
          list: res.rows,
          pagination: {
            max: Math.ceil(res.count / dto.limit),
            cur: dto.page,
          },
        };
      });
  }

  async findOne(id: number, cid: number) {
    return await this.supplierRepository.findOne({
      where: { id: id, cid },
      include: { all: true },
    });
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto, cid: number) {
    const [, [updatedData]] = await this.supplierRepository.update(
      { ...updateSupplierDto },
      { where: { id: id, cid }, returning: true },
    );

    return updatedData;
  }

  async remove(id: number, cid: number) {
    const result = await this.findOne(id, cid);
    if (result.observables.length === 0) {
      return await this.supplierRepository.destroy({
        where: { id, cid },
      });
    } else {
      throw new HttpException(
        'Невозможно удалить поставщика, у которого есть привязанные товары',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cabinet } from './entities/cabinet.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CabinetService {
  constructor(@InjectModel(Cabinet) private cabinetRepository: typeof Cabinet) {}

  async findAllActive() {
    return await this.cabinetRepository.findAll({ where: { isActive: true } });
  }

  @OnEvent('sync.after.add_data')
  async addSyncData(cid: number, param: string, data: any) {
    const cabinet = await this.cabinetRepository.findByPk(cid);
    if (!cabinet) {
      throw new Error('Cabinet not found');
    }

    const date = new Date();

    cabinet.syncData = { ...cabinet.syncData, [param]: { ...data, lastSync: date.toISOString() } };
    await cabinet.save();
  }
}

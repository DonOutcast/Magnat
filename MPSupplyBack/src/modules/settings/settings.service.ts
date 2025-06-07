import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting) private settingRepository: typeof Setting,
  ) {}

  async get(module: string, code: string, cid: number): Promise<any> {
    const res = await this.settingRepository.findOne({
      where: { module: module, code: code, cid },
    });

    return res ? res.value : null;
  }

  async set(module: string, code: string, value: any, cid: number) {
    const [rows, [updatedData]] = await this.settingRepository.update(
      { value: value },
      { where: { module: module, code: code, cid }, returning: true },
    );

    if (rows === 0 && typeof updatedData === 'undefined') {
      const newData = await this.settingRepository.create({
        module,
        code,
        cid,
        value,
      });

      return newData.value;
    }

    return updatedData.value;
  }

  async getAll(cid: number): Promise<Setting[]> {
    const res = await this.settingRepository.findAll({
      where: { cid },
    });

    return res;
  }

  async setAll(
    newSettings: Setting[],
    cid: number,
  ): Promise<Record<string, boolean>> {
    const oldSettings = await this.getAll(cid);

    const oldByModule = {};
    oldSettings.forEach((el) => {
      if (!(el.module in oldByModule)) oldByModule[el.module] = {};
      oldByModule[el.module][el.code] = el.value;
    });

    const isChanged = {};

    await Promise.all(
      newSettings.map(async (el) => {
        if (
          el.module in oldByModule &&
          el.code in oldByModule[el.module] &&
          oldByModule[el.module][el.code] == el.value
        ) {
          return;
        }

        await this.set(el.module, el.code, el.value, cid);
        isChanged[el.module + '.' + el.code] = true;
      }),
    );

    return isChanged;
  }
}

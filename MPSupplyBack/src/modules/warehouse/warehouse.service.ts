import { Injectable } from '@nestjs/common';
import { Warehouse, WarehouseF } from './entities/warehouse.entity';
import { InjectModel } from '@nestjs/sequelize';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UpdateWarehouseWithIdDto } from './dto/update-warehouse-wid.dto';
import { StockService } from '../stock/stock.service';
import { SettingsService } from '../settings/settings.service';
import {
  API_GO_HOSTS,
  MP,
  ORDERBY,
  SETTINGS,
  SETTINGS_MODULE,
  WarehouseResponse,
  WarehouseResponseOzon,
  WarehouseResponseWB,
} from 'src/main.types';
import { convertWHName } from 'src/utilites';
import { isEmpty } from 'class-validator';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(Warehouse) private warehouseRepository: typeof Warehouse,
    private readonly httpService: HttpService,
    private readonly stockService: StockService,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(cid: number, mp: string) {
    return await this.warehouseRepository.findAll({
      order: [[WarehouseF.PRIORITY, ORDERBY.ASC]],
      where: { cid, mp },
    });
  }

  async findOne(id: number, cid: number) {
    return await this.warehouseRepository.findOne({ where: { id, cid } });
  }

  async updateAll(items: UpdateWarehouseWithIdDto[], cid: number, mp: string) {
    await Promise.all(
      items.map(async (element) => {
        await this.warehouseRepository.update({ ...element }, { where: { id: element.id, cid } });
      }),
    );

    this.stockService.updateDefaultVisibility(cid);
    this.stockService.calculate(cid);

    return await this.findAll(cid, mp);
  }

  async sync(cid: number) {
    return {
      [MP.Ozon]: await this.syncMP(cid, MP.Ozon),
      [MP.WB]: await this.syncMP(cid, MP.WB),
    };
  }

  async syncMP(cid: number, mp: string) {
    const existsByName = (await this.findAll(cid, mp)).reduce((r, el) => {
      r[el.name] = el;
      return r;
    }, {});

    let items: WarehouseResponse[] = [];

    if (mp == MP.Ozon) {
      items = await this.getWarehousesOzon(cid);
    } else if (mp == MP.WB) {
      items = await this.getWarehousesWB(cid);
    }

    await this.warehouseRepository.bulkCreate(
      items
        .map((el) => ({
          name: convertWHName(el.name),
          cid,
          mp,
        }))
        .filter((el) => !(el.name in existsByName)),
    );

    return { total: items.length };
  }

  async getWarehousesOzon(cid: number): Promise<WarehouseResponseOzon[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);
    const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);

    if (isEmpty(apiKey) || isEmpty(clientId)) return [];

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.SELLER_OZON + '/warehouses', {
        headers: {
          'Client-Id': clientId,
          'Api-Key': apiKey,
        },
      }),
    );

    return data ?? [];
  }

  async getWarehousesWB(cid: number): Promise<WarehouseResponseWB[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.WB_API_KEY, cid);

    if (isEmpty(apiKey)) return [];

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.SELLER_WB + '/warehouses', {
        headers: {
          Authorization: apiKey,
        },
      }),
    );

    return data ?? [];
  }
}

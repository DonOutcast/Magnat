import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sale } from './entities/sale.entity';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { API_GO_HOSTS, MP, ProductSalesResponseOzon, ProductSalesResponseWB, SETTINGS, SETTINGS_MODULE } from 'src/main.types';
import { ProductService } from '../product/product.service';
import { Op } from 'sequelize';
import { convertWHName } from 'src/utilites';
import { isEmpty } from 'class-validator';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale) private saleRepository: typeof Sale,
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
    private readonly productService: ProductService,
  ) {}

  @OnEvent('settings.changed.' + SETTINGS_MODULE.CALC + '.' + SETTINGS.SALE_CALC_DAYS)
  async sync(cid: number) {
    return {
      [MP.Ozon]: await this.syncOzon(cid),
      [MP.WB]: await this.syncWB(cid),
    };
  }

  async syncOzon(cid: number) {
    const productBySku = (await this.productService.findAllByMP(cid, MP.Ozon)).reduce((r, el) => ((r[el.sku] = +el.id), r), {});

    const syncProducts = await this.getSalesOzon(cid);

    const products = syncProducts
      .filter((el) => el.sku in productBySku)
      .map((el) => ({
        ...el,
        productId: productBySku[el.sku],
        cid,
        warehouse: convertWHName(el.warehouse),
      }));

    await this.saleRepository.destroy({
      // @ts-ignore
      where: { cid, productId: { [Op.in]: Object.values(productBySku) } },
    });
    await this.saleRepository.bulkCreate(products);

    const SKUs = [...new Set(syncProducts.map((el) => el.sku))];

    const undefinedSKUs = SKUs.filter((sku) => !(sku in productBySku));

    return { totalSKU: SKUs.length, undefinedSKUs: undefinedSKUs };
  }

  async syncWB(cid: number) {
    const productByFid = (await this.productService.findAllByMP(cid, MP.WB)).reduce((r, el) => ((r[el.foreignId] = +el.id), r), {});

    const syncProducts = await this.getSalesWB(cid);

    const products = syncProducts
      .filter((el) => el.foreignId in productByFid)
      .map((el) => ({
        ...el,
        productId: productByFid[el.foreignId],
        cid,
        warehouse: convertWHName(el.warehouse),
      }));

    await this.saleRepository.destroy({
      // @ts-ignore
      where: { cid, productId: { [Op.in]: Object.values(productByFid) } },
    });
    await this.saleRepository.bulkCreate(products);

    const SKUs = [...new Set(syncProducts.map((el) => el.foreignId))];

    const undefinedSKUs = SKUs.filter((foreignId) => !(foreignId in productByFid));

    return { totalSKU: SKUs.length, undefinedSKUs: undefinedSKUs };
  }

  async getSalesOzon(cid: number): Promise<ProductSalesResponseOzon[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);
    const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);

    if (isEmpty(apiKey) || isEmpty(clientId)) return [];

    const SALE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.SALE_CALC_DAYS, cid));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 86400 * SALE_CALC_DAYS * 1000);

    let { data } = await firstValueFrom(
      this.httpService.post(
        API_GO_HOSTS.SELLER_OZON + '/products/sales',
        {
          since: start.toISOString(),
          to: end.toISOString(),
        },
        {
          headers: {
            'Client-Id': clientId,
            'Api-Key': apiKey,
          },
        },
      ),
    );

    return data ?? [];
  }

  async getSalesWB(cid: number): Promise<ProductSalesResponseWB[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.WB_API_KEY, cid);

    if (isEmpty(apiKey)) return [];

    const SALE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.SALE_CALC_DAYS, cid));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 86400 * SALE_CALC_DAYS * 1000);

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.SELLER_WB + '/products/sales?dateFrom=' + start.toISOString().substring(0, 10), {
        headers: {
          Authorization:
            'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwODE5djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0MDE5OTM4MCwiaWQiOiJiZjAxOTMzZC0wZjU3LTQ1OWEtYTdlNC02MTY0MDM1ZTZjMDIiLCJpaWQiOjQ0NDYxMjMxLCJvaWQiOjkwOTk2LCJzIjozNiwic2lkIjoiZTUwOWE3ZjQtYjBmMy01ZDAzLWI1MTctNTZkMWE3MTE3NjBmIiwidCI6ZmFsc2UsInVpZCI6NDQ0NjEyMzF9.rnrII6aIAkiRkIJLUIygk1Qlf2HtNmhi3FORq_Ld-OikFd0CvrRR0rnYhQO50glPjx8nGyWZJh_0A0vU_wtMbg',
        },
      }),
    );

    return data ?? [];
  }
}

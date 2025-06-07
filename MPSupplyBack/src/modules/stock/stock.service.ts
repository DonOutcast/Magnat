import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Stock, StockF } from './entities/stock.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Sale } from '../sales/entities/sale.entity';
import sequelize from 'sequelize';
import { Warehouse, WarehouseF } from '../warehouse/entities/warehouse.entity';
import { Observable } from '../observable/entities/observable.entity';
import { ObservableItem } from '../observable/entities/observable-item.entity';
import { Product, ProductF } from '../product/entities/product.entity';
import { SetVisibleDto } from './dto/set-visible.dto';
import { Op } from 'sequelize';
import { SettingsService } from '../settings/settings.service';
import { Sequelize } from 'sequelize-typescript';
import {
  API_GO_HOSTS,
  MP,
  ORDERBY,
  ProductInDeliveryResponseOzon,
  SETTINGS,
  SETTINGS_MODULE,
  StockOnWarehousesResponseOzon,
  StockOnWarehousesResponseWB,
} from 'src/main.types';
import { ProductService } from '../product/product.service';
import { convertWHName } from 'src/utilites';
import { isEmpty } from 'class-validator';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Warehouse) private warehouseRepository: typeof Warehouse,
    @InjectModel(Stock) private stockRepository: typeof Stock,
    @InjectModel(Sale) private saleRepository: typeof Sale,
    @InjectModel(Observable) private obsRepository: typeof Observable,
    @InjectModel(ObservableItem)
    private obsItemRepository: typeof ObservableItem,
    @InjectModel(Product) private productRepository: typeof Product,
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
    private readonly productService: ProductService,
    private sequelize: Sequelize,
  ) {}

  async calculateAvgSaleAndStockNeeded(cid: number) {
    const SALE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.SALE_CALC_DAYS, cid));
    const ENABLE_CALC_COUNT = 2;

    await this.stockRepository.update({ avg_sale: 0, needed: 0 }, { where: { cid, free_to_sell_amount: { [Op.gt]: ENABLE_CALC_COUNT } } });

    const salesRaw = await this.saleRepository.findAll({
      attributes: ['productId', 'warehouse', [sequelize.fn('SUM', sequelize.col('qty')), 'qtys']],
      group: ['productId', 'warehouse'],
      where: { cid },
    });

    const warehousesRaw = await this.warehouseRepository.findAll({
      attributes: [WarehouseF.NAME, WarehouseF.PERIOD_STOCK, WarehouseF.PERIOD_DELIVERY, WarehouseF.VISIBLE],
      where: { cid },
    });

    const stockRaw = await this.stockRepository.findAll({
      attributes: [StockF.PRODUCT_ID, StockF.WAREOUSE_NAME, StockF.PROMISED_AMOUNT, StockF.FREE_AMOUNT],
      where: { cid, free_to_sell_amount: { [Op.gt]: ENABLE_CALC_COUNT } },
    });
    const stocks = {};
    stockRaw.map((el) => {
      if (!(el.productId in stocks)) {
        stocks[el.productId] = {};
      }
      stocks[el.productId][el.warehouse_name] = el.promised_amount + el.free_to_sell_amount;
    });

    const warehousesPeriod = {};
    const warehousesVisible = {};
    warehousesRaw.map((el) => {
      warehousesPeriod[el.name] = el.periodStock + el.periodDelivery;
      warehousesVisible[el.name] = el.visible;
    });

    const transaction = await this.sequelize.transaction();

    for (const sale of salesRaw) {
      const wh = sale.warehouse;
      const avg_sale = parseInt(sale.dataValues['qtys']) / SALE_CALC_DAYS;
      const stockQty = sale.productId in stocks && wh in stocks[sale.productId] ? stocks[sale.productId][wh] : 0;
      const needed = avg_sale == 0 ? 0 : Math.max(0, Math.ceil(avg_sale * (warehousesPeriod[wh] - stockQty / avg_sale)));

      if (sale.productId in stocks && wh in stocks[sale.productId]) {
        await this.stockRepository.update(
          { avg_sale: avg_sale, needed: isNaN(needed) ? 0 : needed },
          {
            where: {
              productId: sale.productId,
              warehouse_name: wh,
              cid,
            },
          },
        );
      } else {
        await this.stockRepository.create({
          avg_sale: avg_sale,
          needed: isNaN(needed) ? 0 : needed,
          productId: sale.productId,
          warehouse_name: wh,
          visible: warehousesVisible[wh],
          cid,
        });
      }
    }

    await transaction.commit();
  }

  async calculateObsItemNeeded(cid: number) {
    const stockItems = await this.stockRepository.findAll({
      attributes: [
        StockF.PRODUCT_ID,
        [sequelize.fn('SUM', sequelize.col(StockF.NEEDED)), StockF.NEEDED],
        [sequelize.fn('SUM', sequelize.col(StockF.AVG_SALE)), StockF.AVG_SALE],
      ],
      group: [StockF.PRODUCT_ID],
      where: { visible: true, cid },
    });

    const needed = stockItems.reduce((r, { needed, productId }) => ((r[+productId] = +needed), r), {});

    const avgSale = stockItems.reduce((r, { avg_sale, productId }) => ((r[+productId] = +avg_sale), r), {});

    await this.obsItemRepository.update({ needed: 0 }, { where: { cid } });

    const obsItems = await this.obsItemRepository.findAll({
      where: { cid },
    });

    const transaction = await this.sequelize.transaction();

    for (const item of obsItems) {
      const need = item.productId in needed ? needed[item.productId] : 0;
      const sale = item.productId in avgSale ? avgSale[item.productId] : 0;

      await this.obsItemRepository.update({ needed: need, avgSale: sale }, { where: { id: item.id, cid } });
    }

    await transaction.commit();
  }

  async calculateObsNeeded(cid: number) {
    const RESERVE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.RESERVE_CALC_DAYS, cid));

    const obsItems = await this.obsItemRepository.findAll({
      attributes: [
        'observableId',
        [sequelize.fn('SUM', sequelize.literal('packing * needed')), 'needed'],
        [sequelize.fn('SUM', sequelize.literal('packing * "avgSale"')), 'avgSale'],
      ],
      group: ['observableId'],
      where: { cid },
    });

    const needObs = obsItems.reduce((r, { needed, observableId }) => ((r[observableId] = parseInt(needed.toString())), r), {});

    const avgSales = obsItems.reduce((r, { avgSale, observableId }) => ((r[observableId] = parseInt(avgSale.toString())), r), {});

    const obs = await this.obsRepository.findAll({ where: { cid } });

    const transaction = await this.sequelize.transaction();

    for (const el of obs) {
      const curNeed = el.id in needObs ? needObs[el.id] : 0;
      const avgSale = el.id in avgSales ? avgSales[el.id] * RESERVE_CALC_DAYS : 0;

      await this.obsRepository.update(
        {
          need: curNeed,
          needmin: Math.ceil(curNeed / el.minCount) * el.minCount,
          stockReserve: avgSale,
          totalNeed: curNeed - el.inOurStock + avgSale,
        },
        { where: { id: el.id, cid } },
      );
    }

    await transaction.commit();
  }

  async calcStockMaxs() {
    await this.sequelize.query('UPDATE stock SET "maxAmount" = GREATEST("maxAmount", free_to_sell_amount);');
    await this.sequelize.query('UPDATE stock SET "maxSale" = GREATEST("maxSale" , avg_sale);');
  }

  async calculate(cid: number) {
    await this.calculateAvgSaleAndStockNeeded(cid);
    await this.calculateObsItemNeeded(cid);
    await this.calculateObsNeeded(cid);

    return 'good job';
  }

  async sync(cid: number) {
    return {
      [MP.Ozon]: await this.syncOzon(cid),
      [MP.WB]: await this.syncWB(cid),
    };
  }

  async syncInDeliveryOzon(cid: number) {
    const { productBySku, existsBySkuWH } = await this.getExistIds(cid);

    const inDeliveriesRaw = await this.getInDeliveryOzon(cid);

    const inDeliveries = inDeliveriesRaw.reduce((r, el) => {
      const key = [el.sku, convertWHName(el.warehouse)].join('_');

      if (key in r) {
        r[key].qty += el.qty;
      } else {
        r[key] = el;
      }
      return r;
    }, {});

    await this.stockRepository.update(
      { delivering_amount: 0 },
      // @ts-ignore
      { where: { cid, productId: { [Op.in]: Object.values(productBySku) } } },
    );

    const toCreateList = [];

    await Promise.all(
      Object.keys(inDeliveries).map(async (key) => {
        const el = inDeliveries[key];

        if (!(key in existsBySkuWH)) {
          if (el.sku in productBySku) {
            toCreateList.push({ ...el, productId: productBySku[el.sku] });
          } else {
            // TODO: udefined stock item
          }
        } else {
          await this.stockRepository.update(
            {
              delivering_amount: el.qty,
            },
            { where: { id: existsBySkuWH[key], cid } },
          );
        }
      }),
    );

    await this.stockRepository.bulkCreate(toCreateList.map((el: any) => ({ ...el, cid })));

    return { cnt: inDeliveriesRaw.length };
  }

  async getInDeliveryOzon(cid: number): Promise<ProductInDeliveryResponseOzon[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);
    const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);

    if (isEmpty(apiKey) || isEmpty(clientId)) return [];

    const SALE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.SALE_CALC_DAYS, cid));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 86400 * SALE_CALC_DAYS * 1000);

    let { data } = await firstValueFrom(
      this.httpService.post(
        API_GO_HOSTS.SELLER_OZON + '/products/delivering',
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

  async getExistIds(cid: number) {
    // Очистка остатков
    const productBySku = (await this.productService.findAllByMP(cid, MP.Ozon)).reduce((r, el) => ((r[el.sku] = +el.id), r), {});

    const exists = await this.stockRepository.findAll({
      attributes: [StockF.ID, StockF.PRODUCT_ID, StockF.WAREOUSE_NAME],
      include: {
        model: Product,
        attributes: [ProductF.SKU],
        where: { mp: MP.Ozon },
      },
    });

    const existsBySkuWH = exists.reduce((r, { id, product, warehouse_name }) => ((r[[product.sku, warehouse_name].join('_')] = id), r), {});

    return { productBySku, existsBySkuWH };
  }

  async syncWB(cid: number) {
    const productByFId = (await this.productService.findAllByMP(cid, MP.WB)).reduce((r, el) => ((r[el.sku] = +el.id), r), {});

    const exists = await this.stockRepository.findAll({
      attributes: [StockF.ID, StockF.PRODUCT_ID, StockF.WAREOUSE_NAME],
      include: {
        model: Product,
        attributes: [ProductF.FOREIGN_ID],
        where: { mp: MP.WB },
      },
    });

    const existsByFIdWH = exists.reduce(
      (r, { id, product, warehouse_name }) => ((r[[product.foreignId, warehouse_name].join('_')] = id), r),
      {},
    );

    // Очистка остатков
    await this.stockRepository.update(
      { promised_amount: 0, free_to_sell_amount: 0, reserved_amount: 0 },
      // @ts-ignore
      { where: { cid, productId: { [Op.in]: Object.values(productByFId) } } },
    );

    const toCreateList = [];

    const elems = await this.getStockOnWarehousesWB(cid);

    await Promise.all(
      elems.map(async (el) => {
        el.warehouse_name = convertWHName(el.warehouse_name);
        const key = [el.foreignId, el.warehouse_name].join('_');
        if (!(key in existsByFIdWH)) {
          if (el.foreignId in productByFId) {
            toCreateList.push({ ...el, productId: productByFId[el.foreignId] });
          } else {
            // TODO: udefined stock item
          }
        } else {
          await this.stockRepository.update(
            {
              promised_amount: el.promised_amount,
              free_to_sell_amount: el.free_to_sell_amount,
              reserved_amount: el.reserved_amount,
            },
            { where: { id: existsByFIdWH[key], cid } },
          );
        }
      }),
    );

    await this.stockRepository.bulkCreate(toCreateList.map((el: any) => ({ ...el, cid })));

    const SKUs = [...new Set(elems.map((el) => el.foreignId))];

    const undefinedSKUs = SKUs.filter((foreignId) => !(foreignId in productByFId));

    return { totalSKU: SKUs.length, undefinedSKUs: undefinedSKUs };
  }

  async syncOzon(cid: number) {
    const { productBySku, existsBySkuWH } = await this.getExistIds(cid);

    await this.stockRepository.update(
      { promised_amount: 0, free_to_sell_amount: 0, reserved_amount: 0 },
      // @ts-ignore
      { where: { cid, productId: { [Op.in]: Object.values(productBySku) } } },
    );

    const elems = await this.getStockOnWarehousesOzon(cid);

    const toCreateList = [];

    await Promise.all(
      elems.map(async (el) => {
        el.warehouse_name = convertWHName(el.warehouse_name);
        const key = [el.sku, el.warehouse_name].join('_');
        if (!(key in existsBySkuWH)) {
          if (el.sku in productBySku) {
            toCreateList.push({ ...el, productId: productBySku[el.sku] });
          } else {
            // TODO: udefined stock item
          }
        } else {
          await this.stockRepository.update(
            {
              promised_amount: el.promised_amount,
              free_to_sell_amount: el.free_to_sell_amount,
              reserved_amount: el.reserved_amount,
            },
            { where: { id: existsBySkuWH[key], cid } },
          );
        }
      }),
    );

    await this.stockRepository.bulkCreate(toCreateList.map((el: any) => ({ ...el, cid })));

    const SKUs = [...new Set(elems.map((el) => el.sku))];

    const undefinedSKUs = SKUs.filter((sku) => !(sku in productBySku));

    return { totalSKU: SKUs.length, undefinedSKUs: undefinedSKUs, inDeliveryToClient: await this.syncInDeliveryOzon(cid) };
  }

  async getStockOnWarehousesOzon(cid: number): Promise<StockOnWarehousesResponseOzon[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);
    const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);

    if (isEmpty(apiKey) || isEmpty(clientId)) return [];

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.SELLER_OZON + '/products/stock', {
        headers: {
          'Client-Id': clientId,
          'Api-Key': apiKey,
        },
      }),
    );

    return data ?? [];
  }

  async getStockOnWarehousesWB(cid: number): Promise<StockOnWarehousesResponseWB[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.WB_API_KEY, cid);

    if (isEmpty(apiKey)) return [];

    const dateFrom = new Date();
    dateFrom.setHours(0, 0, 0, 0);

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.SELLER_WB + '/products/stock?dateFrom=' + dateFrom.toISOString(), {
        headers: {
          Authorization:
            'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwODE5djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0MDE5OTM4MCwiaWQiOiJiZjAxOTMzZC0wZjU3LTQ1OWEtYTdlNC02MTY0MDM1ZTZjMDIiLCJpaWQiOjQ0NDYxMjMxLCJvaWQiOjkwOTk2LCJzIjozNiwic2lkIjoiZTUwOWE3ZjQtYjBmMy01ZDAzLWI1MTctNTZkMWE3MTE3NjBmIiwidCI6ZmFsc2UsInVpZCI6NDQ0NjEyMzF9.rnrII6aIAkiRkIJLUIygk1Qlf2HtNmhi3FORq_Ld-OikFd0CvrRR0rnYhQO50glPjx8nGyWZJh_0A0vU_wtMbg',
        },
      }),
    );

    return data ?? [];
  }

  async getStock(productId: number, cid: number) {
    const product = await this.productRepository.findByPk(productId);
    const warehouses = await this.warehouseRepository.findAll({
      attributes: [WarehouseF.NAME, WarehouseF.PRIORITY, WarehouseF.VISIBLE],
      order: [WarehouseF.PRIORITY],
      where: { cid, mp: product.mp },
    });
    const stock = (await this.stockRepository.findAll({ where: { productId, cid } })).reduce(
      (r, el) => ((r[el.warehouse_name] = el), r),
      {},
    );

    return warehouses.map((el) => {
      if (el.name in stock) {
        return { ...el.dataValues, ...stock[el.name].dataValues };
      } else {
        return {
          ...el.dataValues,
          productId,
          promised_amount: 0,
          free_to_sell_amount: 0,
          reserved_amount: 0,
          avg_sale: 0,
          needed: 0,
        };
      }
    });
  }

  async getRequiredProducts(cid: number) {
    const obsItems = (await this.obsItemRepository.findAll({ where: { cid } })).map((el) => el.productId);

    const itemNeeds = (
      await this.stockRepository.findAll({
        attributes: [StockF.PRODUCT_ID, [sequelize.fn('SUM', sequelize.col(StockF.NEEDED)), StockF.NEEDED]],
        group: [StockF.PRODUCT_ID],
        order: [[StockF.NEEDED, ORDERBY.DESC]],
        where: { cid },
      })
    ).reduce((r, { productId, needed }) => ((r[+productId] = +needed), r), {});

    const requiredProducts = [];
    const c = (
      await this.productRepository.findAll({
        attributes: [ProductF.ID, ProductF.SKU, ProductF.NAME, ProductF.OFFER_ID, ProductF.MP],
        where: { inArchive: false, cid },
      })
    ).map((el) => {
      if (obsItems.includes(el.id)) return;
      requiredProducts.push({
        ...el.dataValues,
        needed: el.id in itemNeeds ? itemNeeds[el.id] : 0,
      });
    });

    return requiredProducts.sort((a, b) => b.needed - a.needed);
  }

  async setVisible(dto: SetVisibleDto, cid: number) {
    const [obj, created] = await this.stockRepository.findOrCreate({
      where: {
        productId: dto.productId,
        warehouse_name: dto.warehouse_name,
        cid,
      },
      defaults: {
        visible: dto.visible,
      },
    });

    if (!created) {
      await obj.update({ visible: dto.visible });
      await this.calculateObsItemNeeded(cid);
      await this.calculateObsNeeded(cid);
    }
  }

  async getNotNeededIds() {
    const obsItems = await this.obsItemRepository.findAll({
      attributes: [],
    });

    return obsItems.map((obsItem) => obsItem.productId);
  }

  async updateDefaultVisibility(cid: number) {
    // Получить список товаров по которым не нужно считать
    const notNeededIds = await this.getNotNeededIds();

    // Получить все склады
    const warehouses = await this.warehouseRepository.findAll({
      attributes: [WarehouseF.NAME, WarehouseF.VISIBLE],
      where: { cid },
    });

    // Получить список visible
    const whVisible = warehouses.filter((wh) => wh.visible).map((wh) => wh.name);
    const whHidden = warehouses.filter((wh) => !wh.visible).map((wh) => wh.name);
    this.stockRepository.update(
      { visible: true },
      {
        where: {
          warehouse_name: { [Op.in]: whVisible },
          productId: { [Op.notIn]: notNeededIds },
          cid,
        },
      },
    );
    this.stockRepository.update(
      { visible: false },
      {
        where: {
          warehouse_name: { [Op.in]: whHidden },
          productId: { [Op.notIn]: notNeededIds },
          cid,
        },
      },
    );
  }

  async getStockArr(productIds: number[], cid: number) {
    const warehouses = await this.warehouseRepository.findAll({
      attributes: [WarehouseF.NAME, WarehouseF.PRIORITY, WarehouseF.VISIBLE, WarehouseF.SHORT_NAME],
      order: [WarehouseF.PRIORITY],
      where: { cid },
    });

    const warehousesByName = warehouses.reduce((r, el) => {
      r[el.name] = el;
      return r;
    }, {});

    const stock = (
      await this.stockRepository.findAll({
        attributes: [StockF.PRODUCT_ID, StockF.WAREOUSE_NAME, StockF.NEEDED],
        where: {
          productId: { [Op.in]: productIds },
          warehouse_name: { [Op.in]: Object.keys(warehousesByName) },
          cid,
        },
      })
    ).reduce((r, el) => {
      if (!r[el.productId]) r[el.productId] = {};
      const wh = warehousesByName[el.warehouse_name];
      r[el.productId][wh.priority] = el.needed;
      return r;
    }, {});

    return { stock, warehouses };
  }

  async getBySaleSpeed(cid: number, mp: string) {
    let itemById = {};

    const items = await this.productRepository.findAll({
      attributes: [ProductF.ID, ProductF.OFFER_ID, ProductF.VOLUME],
      where: { cid, mp },
    });

    items.forEach((el) => {
      itemById[el.id] = el.dataValues;
    });

    return (
      await this.stockRepository.findAll({
        attributes: [
          StockF.WAREOUSE_NAME,
          StockF.FREE_AMOUNT,
          StockF.AVG_SALE,
          StockF.NEEDED,
          StockF.MAX_AMOUNT,
          StockF.MAX_SALE,
          StockF.PRODUCT_ID,
        ],
        where: { cid, productId: { [Op.in]: Object.keys(itemById) } },
        order: [[StockF.MAX_SALE, ORDERBY.DESC]],
      })
    ).map((el) => ({
      ...el.dataValues,
      offerId: itemById[el.productId].offer_id,
      volume: itemById[el.productId].volume,
    }));
  }
}

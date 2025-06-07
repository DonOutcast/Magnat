import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { CapitalAsset, CapitalAssetF } from './entities/asset.entity';
import { OrderService } from 'src/modules/order/order.service';
import { ObservableService } from 'src/modules/observable/observable.service';
import { Stock, StockF } from 'src/modules/stock/entities/stock.entity';
import { Product, ProductF } from 'src/modules/product/entities/product.entity';
import { InjectModel } from '@nestjs/sequelize';
import { ASSET_TYPES, MP, ORDERBY } from 'src/main.types';
import { Observable } from 'src/modules/observable/entities/observable.entity';
import { ObservableItem } from 'src/modules/observable/entities/observable-item.entity';

@Injectable()
export class AssetService {
  constructor(
    private readonly orderService: OrderService,
    private readonly observableService: ObservableService,
    @InjectModel(Observable) private observableRepository: typeof Observable,
    @InjectModel(Stock) private stockRepository: typeof Stock,
    @InjectModel(Product) private productRepository: typeof Product,
    @InjectModel(CapitalAsset) private assetRepository: typeof CapitalAsset,
  ) {}

  async findAll(cid: number) {
    return await this.assetRepository.findAll({ where: { cid }, order: [[CapitalAssetF.AMOUNT, ORDERBY.DESC]] });
  }

  async calcAssets(cid: number) {
    // TODO: Актив 1	Деньги на р/с	….	считывается с отчета ЛК банка, присылаемого на е-мейл.
    this.calcAssetByType(ASSET_TYPES.T1, cid);
    // TODO: Актив 2	Деньги на озон	….	парсится
    this.calcAssetByType(ASSET_TYPES.T2, cid);
    // TODO: Актив 3	Деньги на ВБ	….	парсится
    this.calcAssetByType(ASSET_TYPES.T3, cid);
    // TODO: Актив 12	возврат от клиента Озон	….	количество товаров парсится и умножается на его себестоимость
    this.calcAssetByType(ASSET_TYPES.T12, cid);
    // TODO: Актив 13	возврат от клиента ВБ	….	количество товаров парсится и умножается на его себестоимость
    this.calcAssetByType(ASSET_TYPES.T13, cid);

    // Актив 4	Товары в пути на ФФ	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset4(cid);

    // Актив 6	…в пути на Озон ТК	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset6(cid);
    // Актив 7	…в пути на ВБ ТК	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset7(cid);
    // Актив 8	остатки на Озон 	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset8(cid);
    // Актив 9	остатки на ВБ	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset9(cid);
    // Актив 10	в пути до клиента Озон	….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset10(cid);
    // Актив 11	в пути до клиента ВБ ….	количество товаров парсится и умножается на его себестоимость
    this.calcAsset11(cid);

    // Актив 14	в пути из Китая (закуп)	….	берется из нового подраздела остатков. (см. ТЗ, вкладку "Основное", пункт 6.
    this.calcAsset14(cid);
    // Актив 15	товары в наличии на ФФ	….	берется с остатков в системе.
    this.calcAsset15(cid);
  }

  async calcAssetByType(type: string, cid: number) {
    const [asset, _] = await this.assetRepository.findOrBuild({ where: { cid, type } });

    await this.saveAsset(type, asset.amount || 0, cid);
  }

  async calcAsset4(cid: number) {
    const orders = await this.orderService.findAll(cid);
    let totalAsset4 = 0;

    await Promise.all(
      orders.map(async (order) => {
        if (order.approved) return;

        const orderData = await this.orderService.findOne(order.id, cid);
        orderData.items.every(async (item) => {
          totalAsset4 += Math.ceil((item.needed + item.additional) / item.minCount) * item.minCount * item.price;
        });
      }),
    );

    await this.saveAsset(ASSET_TYPES.T4, totalAsset4, cid);
  }

  async calcAsset6(cid: number) {
    const total = await this.getStockInWayWarehouseTotal(MP.Ozon, cid);

    await this.saveAsset(ASSET_TYPES.T6, total, cid);
  }

  async calcAsset7(cid: number) {
    const total = await this.getStockInWayWarehouseTotal(MP.WB, cid);

    await this.saveAsset(ASSET_TYPES.T7, total, cid);
  }

  async calcAsset8(cid: number) {
    const total = await this.getInStockTotal(MP.Ozon, cid);

    await this.saveAsset(ASSET_TYPES.T8, total, cid);
  }

  async calcAsset9(cid: number) {
    const total = await this.getInStockTotal(MP.WB, cid);

    await this.saveAsset(ASSET_TYPES.T9, total, cid);
  }

  async calcAsset10(cid: number) {
    const total = await this.getStockInWayClientTotal(MP.Ozon, cid);

    await this.saveAsset(ASSET_TYPES.T10, total, cid);
  }

  async calcAsset11(cid: number) {
    const total = await this.getStockInWayClientTotal(MP.WB, cid);

    await this.saveAsset(ASSET_TYPES.T11, total, cid);
  }

  async calcAsset14(cid: number) {
    const sum = await this.observableService.getInWaySum(cid);

    await this.saveAsset(ASSET_TYPES.T14, sum, cid);
  }

  async calcAsset15(cid: number) {
    const sum = await this.observableService.getInOurStockSum(cid);

    await this.saveAsset(ASSET_TYPES.T15, sum, cid);
  }

  async saveAsset(type: string, amount: number, cid: number) {
    const [asset, _] = await this.assetRepository.findOrBuild({ where: { type, cid } });

    asset.amount = amount;
    await asset.save();
  }

  async getInStockTotal(mp: string, cid: number) {
    const productIds = await this.productRepository
      .findAll({ attributes: [ProductF.ID], where: { cid, mp } })
      .then((products) => products.map((product) => product.id));

    const inStock = await this.stockRepository
      .findAll({
        attributes: [StockF.FREE_AMOUNT, StockF.PRODUCT_ID],
        where: { productId: { [Op.in]: productIds } },
      })
      .then((stocks) =>
        stocks.reduce((acc, stock) => {
          if (!(stock.productId in acc)) acc[stock.productId] = 0;
          acc[stock.productId] += stock.free_to_sell_amount;
          return acc;
        }, {}),
      );

    const observables = await this.observableRepository.findAll({
      where: { cid },
      include: [{ model: ObservableItem }],
    });

    return observables.reduce((acc, observable) => {
      const add = observable.items.reduce(
        (accItem, item) => (item.productId in inStock ? accItem + observable.price * item.packing * inStock[item.productId] : accItem),
        0,
      );
      return acc + add;
    }, 0);
  }

  async getStockInWayWarehouseTotal(mp: string, cid: number) {
    const productIds = await this.productRepository
      .findAll({ attributes: [ProductF.ID], where: { cid, mp } })
      .then((products) => products.map((product) => product.id));

    const inStock = await this.stockRepository
      .findAll({
        attributes: [StockF.PROMISED_AMOUNT, StockF.PRODUCT_ID],
        where: { productId: { [Op.in]: productIds } },
      })
      .then((stocks) =>
        stocks.reduce((acc, stock) => {
          if (!(stock.productId in acc)) acc[stock.productId] = 0;
          acc[stock.productId] += stock.promised_amount;
          return acc;
        }, {}),
      );

    const observables = await this.observableRepository.findAll({
      where: { cid },
      include: [{ model: ObservableItem }],
    });

    return observables.reduce((acc, observable) => {
      const add = observable.items.reduce(
        (accItem, item) => (item.productId in inStock ? accItem + observable.price * inStock[item.productId] : accItem),
        0,
      );
      return acc + add;
    }, 0);
  }

  async getStockInWayClientTotal(mp: string, cid: number) {
    const productIds = await this.productRepository
      .findAll({ attributes: [ProductF.ID], where: { cid, mp } })
      .then((products) => products.map((product) => product.id));

    const stockInWay = await this.stockRepository
      .findAll({
        attributes: [StockF.DELIVERING_AMOUNT, StockF.PRODUCT_ID],
        where: { productId: { [Op.in]: productIds } },
      })
      .then((stocks) =>
        stocks.reduce((acc, stock) => {
          if (!(stock.productId in acc)) acc[stock.productId] = 0;
          acc[stock.productId] += stock.delivering_amount;
          return acc;
        }, {}),
      );

    const observables = await this.observableRepository.findAll({
      where: { cid },
      include: [{ model: ObservableItem }],
    });

    return observables.reduce((acc, observable) => {
      const add = observable.items.reduce(
        (accItem, item) => (item.productId in stockInWay ? accItem + observable.price * stockInWay[item.productId] : accItem),
        0,
      );
      return acc + add;
    }, 0);
  }
}

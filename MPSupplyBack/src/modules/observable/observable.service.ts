import { HttpException, HttpStatus, Injectable, StreamableFile } from '@nestjs/common';
import { CreateObservableDto } from './dto/create-observable.dto';
import { UpdateObservableDto } from './dto/update-observable.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Observable, ObservableF } from './entities/observable.entity';
import { ObservableItem } from './entities/observable-item.entity';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { SearchPaginationDto } from 'src/dto/search-pagination.dto';
import { Op } from 'sequelize';
import { StockService } from '../stock/stock.service';
import { utils, write } from 'xlsx';
import { ORDERBY } from 'src/main.types';
import sequelize from 'sequelize';
import { SearchPromo } from '../bids/search_promo/entities/search_promo.entity';

function csvCell(v: any): string {
    const s = (v ?? '').toString();
    if (/[;"\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

@Injectable()
export class ObservableService {
  constructor(
    @InjectModel(Observable) private observableRepository: typeof Observable,
    @InjectModel(ObservableItem)
    private observableItemRepository: typeof ObservableItem,
    @InjectModel(SearchPromo) private searchPromoRepository: typeof SearchPromo,
    private readonly stockService: StockService,
  ) {}

  async create(createObservableDto: CreateObservableDto, cid: number) {
    const observable = await this.observableRepository.create({
      ...createObservableDto,
      cid,
      items: [],
    });

    createObservableDto.items.map(async (item) => {
      await this.observableItemRepository.create({
        ...item,
        cid,
        observableId: observable.id,
      });
    });

    await this.stockService.calculateObsItemNeeded(cid);
    this.stockService.calculateObsNeeded(cid);

    return observable;
  }

  async findAll(dto: SearchPaginationDto, cid: number) {
    const whereParams = { cid };

    if (dto.search) {
      whereParams['name'] = { [Op.iLike]: '%' + dto.search.trim() + '%' };
    }

    return await this.observableRepository
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

  async findAllWItems(cid: number) {
    return await this.observableRepository.findAll({
      order: [
        ['id', ORDERBY.DESC],
        ['items', 'packing', ORDERBY.ASC],
      ],
      include: [{ model: ObservableItem, include: [Product] }],
      where: { cid },
    });
  }

  async findInOurStock(cid: number) {
    return await this.observableRepository.findAll({
      include: [Supplier],
      where: { cid },
    });
  }

  async setInOurStock(items: any[], cid: number) {
    items.forEach((obs) => {
      this.observableRepository.update({ inOurStock: obs.inOurStock + obs.add }, { where: { id: obs.id, cid } });
    });
  }

  async findOne(id: number, cid: number) {
    const observable = await this.observableRepository.findOne({
      include: [{ model: ObservableItem, include: [Product] }, Supplier],
      order: [['items', 'packing', ORDERBY.ASC]],
      where: { id, cid },
    });
    return observable;
  }

  async findOneAnalytics(id: number, cid: number) {
    const observable = await this.observableRepository.findOne({
      include: [{ model: ObservableItem, include: [Product] }, Supplier],
      order: [['items', 'packing', ORDERBY.ASC]],
      where: { id, cid },
    });

    await Promise.all(
      observable.items.map(async (item, key) => {
        const anal = await this.searchPromoRepository.findAll({ where: { sku: item.product.sku } });
        observable.dataValues.items[key].dataValues['analytics'] = anal;
      }),
    );

    return observable;
  }

  async findMany(ids: number[], cid: number) {
    if (typeof ids === 'string') {
      // @ts-ignore
      ids = ids.split(',');
    }
    const items = await this.observableRepository.findAll({
      where: { id: { [Op.in]: ids }, cid },
      include: [Supplier],
    });

    return items;
  }

  async update(id: number, updateObservableDto: UpdateObservableDto, cid: number) {
    const [, [updatedData]] = await this.observableRepository.update(
      {
        supplierId: updateObservableDto.supplierId,
        name: updateObservableDto.name,
        price: updateObservableDto.price,
        minCount: updateObservableDto.minCount,
        items: [],
      },
      { where: { id, cid }, returning: true },
    );

    updateObservableDto.items.map(async (item) => {
      if (item.id) {
        await this.observableItemRepository.update({ ...item }, { where: { id: item.id, cid } });
      } else {
        await this.observableItemRepository.create({
          ...item,
          cid,
          observableId: id,
        });
      }
    });

    await this.stockService.calculateObsItemNeeded(cid);
    this.stockService.calculateObsNeeded(cid);

    return updatedData;
  }

  remove(id: number, cid: number) {
    return this.observableRepository.destroy({ where: { id, cid } });
  }

  async generateCSV(cid: number) {
    const lines = ['Поставщик;Товар;Партия для отгрузки;Кол-во для заказа;Цена за 1шт;Сумма'];
    const observables = await this.observableRepository.findAll({
      include: { model: Supplier },
      order: ['supplierId'],
      where: { cid },
    });

    observables.forEach((observable) => {
      lines.push(
        `${observable.supplier.name};${observable.name};${observable.minCount};${observable.needmin};${observable.price};${observable.price * observable.needmin}`,
      );
    });

    return lines.join('\n');
  }

  async generateCSV2(cid: number) {
    const lines = [];
    const observables = await this.observableRepository.findAll({
      include: { model: Supplier },
      order: ['supplierId'],
      where: { cid },
    });

    let sum = 0;

    observables.forEach((observable) => {
      lines.push([
        observable.supplier.name,
        observable.name,
        observable.minCount,
        observable.needmin,
        observable.price,
        observable.price * observable.needmin,
      ]);
      sum += observable.price * observable.needmin;
    });

    lines.push([, , , , , sum]);

    var ws = utils.aoa_to_sheet(['Поставщик;Товар;Партия для отгрузки;Кол-во для заказа;Цена за 1шт;Сумма'.split(';'), ...lines]);
    var wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Data');
    var buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  async generateObservableCVS(cid: number) {
      const observables = await this.observableRepository.findAll({
          where: { cid },
          order: [['supplierId', 'ASC'], ['id', 'ASC'], ['items', 'packing', 'ASC']],
          include: [
              { model: Supplier },
              { model: ObservableItem, include: [Product] },
          ],
      });
      const header = [
          'Поставщик',
          'Наименование из счёта',
          'Цена',
          'Площадка',
          'Наименование в Ozon Seller',
          'Артикул',
          'SKU',
          'Фасовка',
      ];
      const lines: string[] = [header.join(';')];
      for (const o of observables) {
          for (const it of o.items ?? []) {
              const row = [
                  o.supplier?.name ?? '',
                  o.name ?? '',
                  'Ozon',
                  (o.price ?? 0).toString().replace('.', ','), // возьмите, где актуальнее
                  it.product?.name ?? '',
                  it.product?.offer_id ?? '',
                  it.product?.sku ?? '',
                  it.packing ?? '',
              ].map(csvCell);

              lines.push(row.join(';'));
          }
      }
      const csvWithBom = '\uFEFF' + lines.join('\n');
      const buf = Buffer.from(csvWithBom, 'utf8');
      return new StreamableFile(buf);
  }

  async findBySupplier(id: number, cid: number) {
    return await this.observableRepository.findAll({
      attributes: ['id', 'name'],
      order: ['name'],
      where: { supplierId: id, cid },
    });
  }

  async getWithStock(cid: number, mplaces: string[]) {
    const obs = await this.observableRepository.findAll({
      include: { all: true, nested: true },
      where: { cid, '$items.product.mp$': { [Op.in]: mplaces } },
    });

    const productIds = [];

    await Promise.all(
      obs.map(async (element) => {
        await Promise.all(
          element.items.map(async (item) => {
            productIds.push(item.productId);
          }),
        );
      }),
    );

    const { stock, warehouses } = await this.stockService.getStockArr(productIds, cid);

    const result = {
      obsItems: await Promise.all(
        obs.map((obs) => {
          const items = obs.items.map((item) => {
            return {
              ...item.dataValues,
              stock: item.productId in stock ? stock[item.productId] : {},
            };
          });

          return { ...obs.dataValues, items: items };
        }),
      ),
      warehouses,
    };

    // Сортируем товары по алфавиту (по названию продукта)
    result.obsItems.forEach((obs) => {
      obs.items.sort((a, b) => {
        const nameA = a.product?.name || '';
        const nameB = b.product?.name || '';
        return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
      });
    });

    return result;
  }

  async setLabel(id: number, path: string) {
    return await this.observableItemRepository.update({ barcodePath: path }, { where: { id } });
  }

  async downloadLabel(id: number) {
    const item = await this.observableItemRepository.findOne({
      where: { id },
    });
    const path = item.barcodePath;

    if (!path) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }

    return path;
  }

  async getInOurStockSum(cid: number) {
    const res = await this.observableRepository.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal(`"${ObservableF.IN_OUR_STOCK}" * ${ObservableF.PRICE}`)), ObservableF.IN_OUR_STOCK],
      ],
      where: { cid },
    });

    return res.inOurStock;
  }

  async getInWaySum(cid: number) {
    const res = await this.observableRepository.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.literal(`"${ObservableF.IN_WAY}" * ${ObservableF.PRICE}`)), ObservableF.IN_WAY]],
      where: { cid },
    });

    return res.inWay;
  }

  async findInWay(cid: number) {
    return await this.observableRepository.findAll({
      include: [Supplier],
      where: { cid },
    });
  }

  async setInWay(items: any[], cid: number) {
    items.forEach((obs) => {
      this.observableRepository.update({ inWay: obs.inWay }, { where: { id: obs.id, cid } });
    });
  }
}

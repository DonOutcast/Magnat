import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFullFillDto } from './dto/create-full-fill.dto';
import { UpdateFullFillDto } from './dto/update-full-fill.dto';
import { InjectModel } from '@nestjs/sequelize';
import { FullFill } from './entities/full-fill.entity';
import { FullFillItem } from './entities/full-fill-item.entity';
import { ObservableItem } from '../observable/entities/observable-item.entity';
import { Op } from 'sequelize';
import { Observable } from '../observable/entities/observable.entity';
import { StockService } from '../stock/stock.service';
import { Sequelize } from 'sequelize-typescript';
import { ORDERBY } from 'src/main.types';

@Injectable()
export class FullFillService {
  constructor(
    @InjectModel(FullFill) private fullFillRepository: typeof FullFill,
    @InjectModel(FullFillItem)
    private fullFillItemRepository: typeof FullFillItem,
    @InjectModel(ObservableItem)
    private obsItemRepository: typeof ObservableItem,
    @InjectModel(Observable)
    private obsRepository: typeof Observable,
    private readonly stockService: StockService,
    private sequelize: Sequelize,
  ) {}

  async create(dto: CreateFullFillDto, cid: number) {
    const order = await this.fullFillRepository.create({ cid, mp: dto.mp });

    for (const item of dto.items) {
      await this.fullFillItemRepository.create({
        orderId: order.id,
        obsItemId: item.obsItemId,
        qty: Object.values(item.stock).reduce((sum, r) => sum + r.qty, 0),
        stock: item.stock,
        cid,
      });
    }

    await order.update({
      liters: dto.liters,
      boxes: dto.boxes,
      pallets: dto.pallets,
    });

    return order;
  }

  async findAll(cid: number) {
    return await this.fullFillRepository.findAll({
      order: [['id', ORDERBY.DESC]],
      where: { cid },
    });
  }

  async getNewData(cid: number, mp: string) {
    const obsItems = await this.obsItemRepository.findAll({
      where: {
        '$observable.inOurStock$': { [Op.gt]: 0 },
        '$product.mp$': mp,
        cid,
      },
      include: { all: true, nested: true },
    });

    return {
      items: obsItems.map((obsItem) => {
        return {
          obsItem: obsItem,
          obsItemId: obsItem.id,
          qty: 0,
          stock: {},
        };
      }),
    };
  }

  async findOne(id: number, cid: number) {
    return await this.fullFillRepository.findOne({
      include: { all: true, nested: true },
      where: { id, cid },
    });
  }

  async update(id: number, dto: UpdateFullFillDto, cid: number) {
    await Promise.all(
      dto.items.map((item) => {
        this.fullFillItemRepository.update(
          {
            stock: item.stock,
            qty: Object.values(item.stock).reduce((sum, el) => sum + el.qty, 0),
          },
          { where: { orderId: id, obsItemId: item.obsItemId, cid } },
        );
      }),
    );

    await this.fullFillRepository.update(
      {
        liters: dto.liters,
        boxes: dto.boxes,
        pallets: dto.pallets,
      },
      { where: { id, cid } },
    );
  }

  async setApproved(id: number, cid: number) {
    const ff = await this.fullFillRepository.findOne({
      where: { id, cid },
    });

    if (!ff.approved) {
      await this.fullFillRepository.update({ approved: true }, { where: { id, cid } });

      const items = await this.fullFillItemRepository.findAll({
        where: { orderId: id, cid },
        include: [ObservableItem],
      });

      let obsStockDiff = {};

      items.forEach((item) => {
        if (!(item.obsItem.observableId in obsStockDiff)) {
          obsStockDiff[item.obsItem.observableId] = 0;
        }

        obsStockDiff[item.obsItem.observableId] += item.obsItem.packing * item.qty;
      });

      for (const obsId in obsStockDiff) {
        await this.obsRepository.decrement({ inOurStock: parseInt(obsStockDiff[obsId]) }, { where: { id: obsId, cid } });
      }
    }
  }

  async remove(id: number, cid: number) {
    const fullFill = await this.fullFillRepository.findOne({
      where: { id, cid },
    });

    if (fullFill.inDeliveryWarehouses && Object.values(fullFill.inDeliveryWarehouses).some(Boolean)) {
      throw new HttpException('Нельзя удалить задание ФФ, которое находится в пути', HttpStatus.BAD_REQUEST);
    }

    await this.fullFillRepository.destroy({ where: { id, cid } });
    await this.fullFillItemRepository.destroy({ where: { orderId: id, cid } });
  }

  async getInDeliverySettings(id: number, cid: number) {
    const fullFill = await this.fullFillRepository.findOne({
      where: { id, cid },
    });

    if (fullFill.inDeliveryWarehouses) {
      return fullFill.inDeliveryWarehouses;
    }

    const inDeliveryWarehouses = {};

    const items = await this.fullFillItemRepository.findAll({
      where: { orderId: id, cid },
    });

    items.forEach((item) => {
      Object.keys(item.stock).forEach((whName: string) => {
        if (!(whName in inDeliveryWarehouses)) {
          inDeliveryWarehouses[whName] = false;
        }
      });
    });

    fullFill.inDeliveryWarehouses = inDeliveryWarehouses;
    await fullFill.save();

    return inDeliveryWarehouses;
  }

  async setInDeliverySettings(id: number, settingsDto: any, cid: number) {
    const fullFill = await this.findOne(id, cid);

    const transaction = await this.sequelize.transaction();

    Object.keys(settingsDto).forEach((whName: string) => {
      // Сняли флажок
      if (fullFill.inDeliveryWarehouses[whName] && !settingsDto[whName]) {
        this.changeInDeliveryWh(fullFill, whName, false);
      }
      // Поставили флажок
      if (!fullFill.inDeliveryWarehouses[whName] && settingsDto[whName]) {
        this.changeInDeliveryWh(fullFill, whName, true);
      }
    });

    await transaction.commit();

    fullFill.inDeliveryWarehouses = settingsDto;
    await fullFill.save();

    await this.stockService.calculate(cid);

    return fullFill;
  }

  private async changeInDeliveryWh(fullFill: FullFill, whName: string, increment: boolean = true) {
    fullFill.items.forEach((item) => {
      if (whName in item.stock && item.stock[whName].qty > 0) {
        const stockExist = item.obsItem.product.stock.filter((stock) => stock.warehouse_name === whName);

        if (stockExist.length === 1) {
          const stockItem = stockExist.shift();

          stockItem.promised_amount = stockItem.promised_amount + item.stock[whName].qty * (increment ? 1 : -1);
          stockItem.save();
        }
      }
    });
  }
}

import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { ORDERBY } from 'src/main.types';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order) private _orderRepository: typeof Order,
    @InjectModel(OrderItem) private _orderItemRepository: typeof OrderItem,
  ) {}
  async create(createOrderDto: CreateOrderDto, cid: number) {
    const order = await this._orderRepository.create({ cid });

    await this._orderItemRepository.bulkCreate(
      createOrderDto.items.map((el) => ({
        ...el,
        orderId: order.id,
        cid,
      })),
    );

    return {
      ...order.dataValues,
      items: await order.$get('items', { include: [Supplier] }),
    };
  }

  async findAll(cid: number) {
    return await this._orderRepository.findAll({
      order: [['id', ORDERBY.DESC]],
      where: { cid },
    });
  }

  async findOne(id: number, cid: number) {
    return await this._orderRepository.findOne({
      where: { id, cid },
      include: { model: OrderItem, include: [Supplier] },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, cid: number) {
    await Promise.all(
      updateOrderDto.items.map((item) => {
        this._orderItemRepository.update({ additional: item.additional }, { where: { id: item.id, cid } });
      }),
    );

    const order = await this._orderRepository.findOne({
      where: { id, cid },
      include: [OrderItem],
    });

    const ts = new Date();
    order.ts = ts.getTime().toString();
    order.save();

    return order;
  }

  async remove(id: number, cid: number) {
    await this._orderRepository.destroy({ where: { id, cid } });
  }

  async setApproved(id: number, cid: number) {
    await this._orderRepository.update({ approved: true }, { where: { id, cid } });
  }
}

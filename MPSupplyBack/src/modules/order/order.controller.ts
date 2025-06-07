import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/decorators/user.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @User('cid') cid: number) {
    return this.orderService.create(createOrderDto, cid);
  }

  @Get()
  findAll(@User('cid') cid: number) {
    return this.orderService.findAll(cid);
  }

  @Post('approve/:id')
  setApproved(@Param('id') id: string, @User('cid') cid: number) {
    return this.orderService.setApproved(+id, cid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('cid') cid: number) {
    return this.orderService.findOne(+id, cid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @User('cid') cid: number) {
    return this.orderService.update(+id, updateOrderDto, cid);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('cid') cid: number) {
    return this.orderService.remove(+id, cid);
  }
}

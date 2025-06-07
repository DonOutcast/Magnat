import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StockService } from './stock.service';
import { SetVisibleDto } from './dto/set-visible.dto';
import { CabinetService } from '../cabinet/cabinet.service';
import { User } from 'src/decorators/user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly cabinetService: CabinetService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('sync')
  async sync() {
    const cabinetes = await this.cabinetService.findAllActive();

    cabinetes.forEach(async (cabinet) => {
      const stats = await this.stockService.sync(cabinet.id);
      this.eventEmitter.emit('sync.after.add_data', cabinet.id, 'stock', stats);
    });

    return 'OK';
  }

  @Get('calc')
  async calculate() {
    const cabinetes = await this.cabinetService.findAllActive();

    await Promise.all(
      cabinetes.map(async (cabinet) => {
        await this.stockService.calculate(cabinet.id);
      }),
    );

    await this.stockService.calcStockMaxs();

    return 'OK';
  }

  @Get('byproduct/:productId')
  getStock(@Param('productId') productId: string, @User('cid') cid: number) {
    return this.stockService.getStock(+productId, cid);
  }

  @Get('required')
  getRequiredProducts(@User('cid') cid: number) {
    return this.stockService.getRequiredProducts(cid);
  }

  @Post('visible')
  async setVisible(@Body() data: SetVisibleDto, @User('cid') cid: number) {
    return await this.stockService.setVisible(data, cid);
  }

  @Get('salespeed/:mp')
  getAll(@Param('mp') mp: string, @User('cid') cid: number) {
    return this.stockService.getBySaleSpeed(cid, mp);
  }
}

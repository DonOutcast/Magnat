import { Controller, Get } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CabinetService } from '../cabinet/cabinet.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly cabinetService: CabinetService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('sync')
  async sync() {
    const cabinetes = await this.cabinetService.findAllActive();

    cabinetes.forEach(async (cabinet) => {
      const stats = await this.salesService.sync(cabinet.id);
      this.eventEmitter.emit('sync.after.add_data', cabinet.id, 'sales', stats);
    });

    return 'OK';
  }
}

import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { AutoCompleteDto } from 'src/dto/autocomplete.dto';
import { CabinetService } from '../cabinet/cabinet.service';
import { User } from 'src/decorators/user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly cabinetService: CabinetService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('sync')
  async sync() {
    const cabinetes = await this.cabinetService.findAllActive();

    cabinetes.forEach(async (cabinet) => {
      const stats = await this.productService.sync(cabinet.id);
      this.eventEmitter.emit('sync.after.add_data', cabinet.id, 'products', stats);
    });

    return 'OK';
  }

  @Get('not_required')
  notRequired(@User('cid') cid: number) {
    return this.productService.notRequired(cid);
  }

  @Get('autocomplete')
  autocomplete(@Query() dto: AutoCompleteDto, @User('cid') cid: number) {
    return this.productService.autocomplete(dto, cid);
  }

  @Post(':id/to_archive')
  toArchive(@Param('id') id: string, @User('cid') cid: number) {
    return this.productService.toArchive(+id, cid);
  }

  @Post(':id/from_archive')
  fromArchive(@Param('id') id: string, @User('cid') cid: number) {
    return this.productService.fromArchive(+id, cid);
  }
}

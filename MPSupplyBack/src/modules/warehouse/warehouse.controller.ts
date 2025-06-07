import { Controller, Get, Body, Patch, Param, Req } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Warehouse } from './entities/warehouse.entity';
import { UpdateWarehouseWithIdDto } from './dto/update-warehouse-wid.dto';
import { SettingsService } from '../settings/settings.service';
import { User } from 'src/decorators/user.decorator';
import { CabinetService } from '../cabinet/cabinet.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SETTINGS, SETTINGS_MODULE } from 'src/main.types';

@ApiTags('Склады')
@Controller('warehouses')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly settingsService: SettingsService,
    private readonly cabinetService: CabinetService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('sync')
  async sync() {
    const cabinetes = await this.cabinetService.findAllActive();

    cabinetes.forEach(async (cabinet) => {
      const stats = await this.warehouseService.sync(cabinet.id);
      this.eventEmitter.emit('sync.after.add_data', cabinet.id, 'warehouses', stats);
    });

    return 'OK';
  }

  @ApiOperation({ summary: 'Список складов' })
  // @ApiResponse({ status: 200, type: [Warehouse] })
  @Get('mp/:mp')
  async findAll(@Param('mp') mp: string, @User('cid') cid: number) {
    const SALE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.SALE_CALC_DAYS, cid));

    const RESERVE_CALC_DAYS = parseInt(await this.settingsService.get(SETTINGS_MODULE.CALC, SETTINGS.RESERVE_CALC_DAYS, cid));

    return {
      saleCalcDays: SALE_CALC_DAYS,
      reserveCalcDays: RESERVE_CALC_DAYS,
      items: await this.warehouseService.findAll(cid, mp),
    };
  }

  @ApiOperation({ summary: 'Склад' })
  @ApiResponse({ status: 200, type: Warehouse })
  @Get(':id')
  findOne(@Param('id') id: string, @User('cid') cid: number) {
    return this.warehouseService.findOne(+id, cid);
  }

  @ApiOperation({ summary: 'Обновить все склады' })
  @ApiResponse({ status: 200, type: [Warehouse] })
  @Patch('mp/:mp')
  async updateAll(
    @Param('mp') mp: string,
    @Body()
    dto: {
      items: UpdateWarehouseWithIdDto[];
    },
    @User('cid') cid: number,
  ) {
    return await this.warehouseService.updateAll(dto.items, cid, mp);
  }
}

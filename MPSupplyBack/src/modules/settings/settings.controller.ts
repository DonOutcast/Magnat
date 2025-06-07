import { Controller, Get, Body, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from '../settings/settings.service';
import { User } from 'src/decorators/user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SETTINGS, SETTINGS_MODULE } from 'src/main.types';

@ApiTags('Настройки')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Список настроек' })
  @Get()
  async findAll(@User('cid') cid: number) {
    return await this.settingsService.getAll(cid);
  }

  @ApiOperation({ summary: 'Обновить все настройки' })
  @Patch()
  async updateAll(
    @Body()
    dto: any[],
    @User('cid') cid: number,
  ) {
    const isChanged = await this.settingsService.setAll(dto, cid);

    const key = SETTINGS_MODULE.CALC + '.' + SETTINGS.SALE_CALC_DAYS;

    if (isChanged[key]) {
      this.eventEmitter.emit('settings.changed.' + key, cid);
    }

    return isChanged;
  }
}

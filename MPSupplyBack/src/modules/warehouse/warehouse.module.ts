import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Warehouse } from './entities/warehouse.entity';
import { HttpModule } from '@nestjs/axios';
import { StockModule } from '../stock/stock.module';
import { SettingsModule } from '../settings/settings.module';
import { SalesModule } from '../sales/sales.module';
import { CabinetModule } from '../cabinet/cabinet.module';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService],
  imports: [SequelizeModule.forFeature([Warehouse]), HttpModule, StockModule, SettingsModule, CabinetModule],
})
export class WarehouseModule {}

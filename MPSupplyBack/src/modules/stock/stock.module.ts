import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { Stock } from './entities/stock.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Warehouse } from '../warehouse/entities/warehouse.entity';
import { ObservableItem } from '../observable/entities/observable-item.entity';
import { Observable } from '../observable/entities/observable.entity';
import { Product } from '../product/entities/product.entity';
import { SettingsModule } from '../settings/settings.module';
import { CabinetModule } from '../cabinet/cabinet.module';
import { ProductModule } from '../product/product.module';

@Module({
  controllers: [StockController],
  providers: [StockService],
  imports: [
    SequelizeModule.forFeature([
      Stock,
      Sale,
      Warehouse,
      ObservableItem,
      Observable,
      Product,
    ]),
    HttpModule,
    SettingsModule,
    CabinetModule,
    ProductModule,
  ],
  exports: [StockService],
})
export class StockModule {}

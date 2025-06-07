import { Module } from '@nestjs/common';
import { ObservableService } from './observable.service';
import { ObservableController } from './observable.controller';
import { Observable } from './entities/observable.entity';
import { ObservableItem } from './entities/observable-item.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { StockModule } from '../stock/stock.module';
import { SearchPromo } from '../bids/search_promo/entities/search_promo.entity';

@Module({
  controllers: [ObservableController],
  providers: [ObservableService],
  imports: [SequelizeModule.forFeature([Observable, ObservableItem, SearchPromo]), StockModule],
  exports: [ObservableService],
})
export class ObservableModule {}

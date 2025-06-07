import { Module } from '@nestjs/common';
import { FullFillService } from './full-fill.service';
import { FullFillController } from './full-fill.controller';
import { FullFill } from './entities/full-fill.entity';
import { FullFillItem } from './entities/full-fill-item.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { ObservableItem } from '../observable/entities/observable-item.entity';
import { Observable } from '../observable/entities/observable.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  controllers: [FullFillController],
  providers: [FullFillService],
  imports: [
    SequelizeModule.forFeature([
      FullFill,
      FullFillItem,
      ObservableItem,
      Observable,
    ]),
    StockModule,
  ],
})
export class FullFillModule {}

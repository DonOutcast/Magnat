import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CapitalAsset } from './entities/asset.entity';
import { Stock } from 'src/modules/stock/entities/stock.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { ObservableItem } from 'src/modules/observable/entities/observable-item.entity';
import { OrderModule } from 'src/modules/order/order.module';
import { ObservableModule } from 'src/modules/observable/observable.module';
import { Observable } from 'src/modules/observable/entities/observable.entity';

@Module({
  controllers: [AssetController],
  providers: [AssetService],
  imports: [SequelizeModule.forFeature([CapitalAsset, Stock, Product, Observable, ObservableItem]), OrderModule, ObservableModule],
})
export class AssetModule {}

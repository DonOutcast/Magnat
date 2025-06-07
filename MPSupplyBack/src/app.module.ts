import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './modules/user/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './modules/user/user/entities/user.entity';
import { RolesModule } from './modules/user/roles/roles.module';
import { Role } from './modules/user/roles/entities/role.entity';
import { UserRoles } from './modules/user/roles/entities/user-roles.entity';
import { AuthModule } from './modules/user/auth/auth.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Supplier } from './modules/supplier/entities/supplier.entity';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { Warehouse } from './modules/warehouse/entities/warehouse.entity';
import { ProductModule } from './modules/product/product.module';
import { ObservableModule } from './modules/observable/observable.module';
import { Setting } from './modules/settings/entities/setting.entity';
import { SupplierModule } from './modules/supplier/supplier.module';
import { Observable } from './modules/observable/entities/observable.entity';
import { ObservableItem } from './modules/observable/entities/observable-item.entity';
import { Product } from './modules/product/entities/product.entity';
import { StockModule } from './modules/stock/stock.module';
import { Stock } from './modules/stock/entities/stock.entity';
import { SalesModule } from './modules/sales/sales.module';
import { OrderModule } from './modules/order/order.module';
import { FullFillModule } from './modules/full-fill/full-fill.module';
import { CabinetModule } from './modules/cabinet/cabinet.module';
import { Cabinet } from './modules/cabinet/entities/cabinet.entity';
import { UserCabinetes } from './modules/user/user/entities/user-cabinetes.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CapitalAsset } from './modules/capital/asset/entities/asset.entity';
import { AssetModule } from './modules/capital/asset/asset.module';
import { LiabilityModule } from './modules/capital/liability/liability.module';
import { CapitalLiability } from './modules/capital/liability/entities/liability.entity';
import { CampaignModule } from './modules/bids/campaign/campaign.module';
import { Campaing } from './modules/bids/campaign/entities/campaign.entity';
import { SearchPromoModule } from './modules/bids/search_promo/search_promo.module';
import { SearchPromo } from './modules/bids/search_promo/entities/search_promo.entity';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CacheModule.register({ isGlobal: true, ttl: 2, max: 10000 }),
    ConfigModule.forRoot({
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [
        User,
        Role,
        UserRoles,
        Setting,
        Supplier,
        Warehouse,
        Product,
        Observable,
        ObservableItem,
        Stock,
        Cabinet,
        UserCabinetes,
        CapitalAsset,
        CapitalLiability,
        Campaing,
        SearchPromo,
      ],
      autoLoadModels: true,
      timezone: '+03:00',
    }),
    UserModule,
    RolesModule,
    AuthModule,
    SupplierModule,
    WarehouseModule,
    ProductModule,
    ObservableModule,
    StockModule,
    SalesModule,
    OrderModule,
    FullFillModule,
    CabinetModule,
    AssetModule,
    LiabilityModule,
    CampaignModule,
    SearchPromoModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}

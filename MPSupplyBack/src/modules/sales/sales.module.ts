import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { Sale } from './entities/sale.entity';
import { SettingsModule } from '../settings/settings.module';
import { CabinetModule } from '../cabinet/cabinet.module';
import { ProductModule } from '../product/product.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [
    SequelizeModule.forFeature([Sale]),
    HttpModule,
    SettingsModule,
    CabinetModule,
    ProductModule,
  ],
  exports: [SalesService],
})
export class SalesModule {}

import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '../settings/settings.module';
import { CabinetModule } from '../cabinet/cabinet.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [
    SequelizeModule.forFeature([Product]),
    HttpModule,
    SettingsModule,
    CabinetModule,
  ],
  exports: [ProductService],
})
export class ProductModule {}

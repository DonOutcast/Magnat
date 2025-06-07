import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  imports: [SequelizeModule.forFeature([Setting])],
  exports: [SettingsService],
})
export class SettingsModule {}

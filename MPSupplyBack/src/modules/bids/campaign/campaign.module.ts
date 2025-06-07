import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from 'src/modules/settings/settings.module';
import { CabinetModule } from 'src/modules/cabinet/cabinet.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaing } from './entities/campaign.entity';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService],
  imports: [SequelizeModule.forFeature([Campaing]), HttpModule, SettingsModule, CabinetModule],
})
export class CampaignModule {}

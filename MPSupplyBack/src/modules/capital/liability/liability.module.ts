import { Module } from '@nestjs/common';
import { LiabilityService } from './liability.service';
import { LiabilityController } from './liability.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CapitalLiability } from './entities/liability.entity';

@Module({
  controllers: [LiabilityController],
  providers: [LiabilityService],
  imports: [SequelizeModule.forFeature([CapitalLiability])],
})
export class LiabilityModule {}

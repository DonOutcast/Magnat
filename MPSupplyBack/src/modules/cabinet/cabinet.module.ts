import { Module } from '@nestjs/common';
import { CabinetService } from './cabinet.service';
import { CabinetController } from './cabinet.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Cabinet } from './entities/cabinet.entity';

@Module({
  controllers: [CabinetController],
  providers: [CabinetService],
  imports: [SequelizeModule.forFeature([Cabinet])],
  exports: [CabinetService],
})
export class CabinetModule {}

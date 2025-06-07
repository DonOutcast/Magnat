import { Module } from '@nestjs/common';
import { SearchPromoService } from './search_promo.service';
import { SearchPromoController } from './search_promo.controller';

@Module({
  controllers: [SearchPromoController],
  providers: [SearchPromoService],
})
export class SearchPromoModule {}

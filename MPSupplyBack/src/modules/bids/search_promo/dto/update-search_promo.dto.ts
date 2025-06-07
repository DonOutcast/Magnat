import { PartialType } from '@nestjs/swagger';
import { CreateSearchPromoDto } from './create-search_promo.dto';

export class UpdateSearchPromoDto extends PartialType(CreateSearchPromoDto) {}

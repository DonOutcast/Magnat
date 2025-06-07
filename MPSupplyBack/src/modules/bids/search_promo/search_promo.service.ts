import { Injectable } from '@nestjs/common';
import { CreateSearchPromoDto } from './dto/create-search_promo.dto';
import { UpdateSearchPromoDto } from './dto/update-search_promo.dto';

@Injectable()
export class SearchPromoService {
  create(createSearchPromoDto: CreateSearchPromoDto) {
    return 'This action adds a new searchPromo';
  }

  findAll() {
    return `This action returns all searchPromo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} searchPromo`;
  }

  update(id: number, updateSearchPromoDto: UpdateSearchPromoDto) {
    return `This action updates a #${id} searchPromo`;
  }

  remove(id: number) {
    return `This action removes a #${id} searchPromo`;
  }
}

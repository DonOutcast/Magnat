import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SearchPromoService } from './search_promo.service';
import { CreateSearchPromoDto } from './dto/create-search_promo.dto';
import { UpdateSearchPromoDto } from './dto/update-search_promo.dto';

@Controller('search-promo')
export class SearchPromoController {
  constructor(private readonly searchPromoService: SearchPromoService) {}

  @Post()
  create(@Body() createSearchPromoDto: CreateSearchPromoDto) {
    return this.searchPromoService.create(createSearchPromoDto);
  }

  @Get()
  findAll() {
    return this.searchPromoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.searchPromoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSearchPromoDto: UpdateSearchPromoDto) {
    return this.searchPromoService.update(+id, updateSearchPromoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.searchPromoService.remove(+id);
  }
}

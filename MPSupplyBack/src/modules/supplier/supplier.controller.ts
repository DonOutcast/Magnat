import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Supplier } from './entities/supplier.entity';
import { SearchPaginationDto } from 'src/dto/search-pagination.dto';
import { User } from 'src/decorators/user.decorator';

@ApiTags('Поставщики')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @ApiOperation({ summary: 'Создание поставщика' })
  @ApiResponse({ status: 201, type: Supplier })
  @Post()
  create(
    @Body() createSupplierDto: CreateSupplierDto,
    @User('cid') cid: number,
  ) {
    return this.supplierService.create(createSupplierDto, cid);
  }

  @ApiOperation({ summary: 'Список поставщиков' })
  @ApiResponse({ status: 200, type: [Supplier] })
  @Get()
  findAll(@Query() dto: SearchPaginationDto, @User('cid') cid: number) {
    return this.supplierService.findAll(dto, cid);
  }

  @ApiOperation({ summary: 'Поставщик' })
  @ApiResponse({ status: 200, type: Supplier })
  @Get(':id')
  findOne(@Param('id') id: string, @User('cid') cid: number) {
    return this.supplierService.findOne(+id, cid);
  }

  @ApiOperation({ summary: 'Изменение поставщика' })
  @ApiResponse({ status: 200, type: Supplier })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @User('cid') cid: number,
  ) {
    return this.supplierService.update(+id, updateSupplierDto, cid);
  }

  @ApiOperation({ summary: 'Удаление поставщика' })
  @Delete(':id')
  remove(@Param('id') id: string, @User('cid') cid: number) {
    return this.supplierService.remove(+id, cid);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LiabilityService } from './liability.service';
import { CreateLiabilityDto } from './dto/create-liability.dto';
import { UpdateLiabilityDto } from './dto/update-liability.dto';
import { User } from 'src/decorators/user.decorator';

@Controller('capital/liability')
export class LiabilityController {
  constructor(private readonly liabilityService: LiabilityService) {}

  @Post()
  create(@Body() createLiabilityDto: CreateLiabilityDto, @User('cid') cid: number) {
    return this.liabilityService.create(createLiabilityDto, cid);
  }

  @Get()
  findAll(@User('cid') cid: number) {
    return this.liabilityService.findAll(cid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('cid') cid: number) {
    return this.liabilityService.findOne(+id, cid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLiabilityDto: UpdateLiabilityDto, @User('cid') cid: number) {
    return this.liabilityService.update(+id, updateLiabilityDto, cid);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('cid') cid: number) {
    return this.liabilityService.remove(+id, cid);
  }
}

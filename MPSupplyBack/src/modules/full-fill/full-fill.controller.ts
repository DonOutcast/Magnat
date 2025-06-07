import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FullFillService } from './full-fill.service';
import { CreateFullFillDto } from './dto/create-full-fill.dto';
import { UpdateFullFillDto } from './dto/update-full-fill.dto';
import { User } from 'src/decorators/user.decorator';

@Controller('full-fill')
export class FullFillController {
  constructor(private readonly fullFillService: FullFillService) {}

  @Get(':id/in_delivery')
  getInDeliverySettings(@Param('id') id: string, @User('cid') cid: number) {
    return this.fullFillService.getInDeliverySettings(+id, cid);
  }

  @Post(':id/in_delivery')
  setInDeliverySettings(
    @Param('id') id: string,
    @Body() settingsDto: any,
    @User('cid') cid: number,
  ) {
    return this.fullFillService.setInDeliverySettings(+id, settingsDto, cid);
  }

  @Post()
  create(
    @Body() createFullFillDto: CreateFullFillDto,
    @User('cid') cid: number,
  ) {
    return this.fullFillService.create(createFullFillDto, cid);
  }

  @Post('approve/:id')
  setApproved(@Param('id') id: string, @User('cid') cid: number) {
    return this.fullFillService.setApproved(+id, cid);
  }

  @Get('new/:mp')
  getNewData(@Param('mp') mp: string, @User('cid') cid: number) {
    return this.fullFillService.getNewData(cid, mp);
  }

  @Get()
  findAll(@User('cid') cid: number) {
    return this.fullFillService.findAll(cid);
  }

  @Get(':id/:mp')
  findOne(
    @Param('id') id: string,
    @Param('mp') mp: string,
    @User('cid') cid: number,
  ) {
    return this.fullFillService.findOne(+id, cid);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFullFillDto: UpdateFullFillDto,
    @User('cid') cid: number,
  ) {
    return this.fullFillService.update(+id, updateFullFillDto, cid);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('cid') cid: number) {
    return this.fullFillService.remove(+id, cid);
  }
}

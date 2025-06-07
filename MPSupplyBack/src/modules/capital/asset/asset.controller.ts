import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssetService } from './asset.service';
import { User } from 'src/decorators/user.decorator';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('capital/assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get('calc')
  calc() {
    return this.assetService.calcAssets(1);
  }

  @Get()
  findAll(@User('cid') cid: number) {
    return this.assetService.findAll(cid);
  }

  @Patch(':type')
  patch(@Param('type') type: string, @Body() dto: UpdateAssetDto, @User('cid') cid: number) {
    return this.assetService.saveAsset(type, dto.amount, cid);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Header,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ObservableService } from './observable.service';
import { CreateObservableDto } from './dto/create-observable.dto';
import { UpdateObservableDto } from './dto/update-observable.dto';
import { SearchPaginationDto } from 'src/dto/search-pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { extname, join } from 'path';
import { User } from 'src/decorators/user.decorator';

const mimeTypes: { [key: string]: string } = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

@Controller('observable')
export class ObservableController {
  constructor(private readonly observableService: ObservableService) {}

  @Post('label/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/label/',
        filename: (req, file, callback): void => {
          callback(null, `${req.params.id}.${file.originalname.split('.').pop()}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Param('id') id: string) {
    return this.observableService.setLabel(+id, file.path);
  }

  @Get('label/:id')
  async getFile(@Param('id') id: number) {
    const path = join(process.cwd(), await this.observableService.downloadLabel(id));

    const file = createReadStream(path);

    return new StreamableFile(file, {
      type: getMimeType(path),
    });
  }

  @Post()
  create(@Body() createObservableDto: CreateObservableDto, @User('cid') cid: number) {
    return this.observableService.create(createObservableDto, cid);
  }

  @Get()
  findAll(@Query() dto: SearchPaginationDto, @User('cid') cid: number) {
    return this.observableService.findAll(dto, cid);
  }

  @Get('winourstock')
  findInOurStock(@User('cid') cid: number) {
    return this.observableService.findInOurStock(cid);
  }

  @Patch('winourstock')
  setInOurStock(@Body() items: any[], @User('cid') cid: number) {
    return this.observableService.setInOurStock(items, cid);
  }

  @Get('winway')
  findInWay(@User('cid') cid: number) {
    return this.observableService.findInWay(cid);
  }

  @Patch('winway')
  setInWay(@Body() items: any[], @User('cid') cid: number) {
    return this.observableService.setInWay(items, cid);
  }

  @Get('many')
  findMany(@Query() dto: { ids: number[] }, @User('cid') cid: number) {
    return this.observableService.findMany(dto.ids, cid);
  }

  @Get('witems')
  findAllWItems(@User('cid') cid: number) {
    return this.observableService.findAllWItems(cid);
  }

  @Get('wstock')
  findAllWStock(@Query() dto: { mplaces: string }, @User('cid') cid: number) {
    return this.observableService.getWithStock(cid, dto.mplaces.split(','));
  }

  @Get('csv')
  generateCSV(@User('cid') cid: number) {
    return this.observableService.generateCSV(cid);
  }

  @Get('supplier/:id')
  findBySupplier(@Param('id') id: string, @User('cid') cid: number) {
    return this.observableService.findBySupplier(+id, cid);
  }

  @Get('csv2')
  @Header('Content-Disposition', 'attachment; filename="SheetJSNest.xlsx"')
  async downloadXlsxFile(@User('cid') cid: number): Promise<StreamableFile> {
    return this.observableService.generateCSV2(cid);
  }

  @Get(':id/analytics')
  findOneAnalytics(@Param('id') id: string, @User('cid') cid: number) {
    return this.observableService.findOneAnalytics(+id, cid);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('cid') cid: number) {
    return this.observableService.findOne(+id, cid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateObservableDto: UpdateObservableDto, @User('cid') cid: number) {
    return this.observableService.update(+id, updateObservableDto, cid);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('cid') cid: number) {
    return this.observableService.remove(+id, cid);
  }
}

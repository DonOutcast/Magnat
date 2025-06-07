import { Controller } from '@nestjs/common';
import { CabinetService } from './cabinet.service';

@Controller('cabinet')
export class CabinetController {
  constructor(private readonly cabinetService: CabinetService) {}
}

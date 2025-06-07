import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Campaing } from './entities/campaign.entity';
import { SettingsService } from 'src/modules/settings/settings.service';
import { HttpService } from '@nestjs/axios';
import { isEmpty } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { API_GO_HOSTS, MP, SETTINGS, SETTINGS_MODULE } from 'src/main.types';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaing) private campaingRepository: typeof Campaing,
    private readonly settingsService: SettingsService,
    private readonly httpService: HttpService,
  ) {}

  async sync(cid: number): Promise<void> {
    const data = await this.getBidCompaniesOzon(cid);

    await this.campaingRepository.bulkCreate(
      data.map((value) => ({ ...value, id: null, campaingId: value.id, cid, mp: MP.Ozon })),
      { updateOnDuplicate: ['campaingId', 'cid'] },
    );
  }

  async getBidCompaniesOzon(cid: number): Promise<any[]> {
    const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);
    const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);

    if (isEmpty(apiKey) || isEmpty(clientId)) return [];

    let { data } = await firstValueFrom(
      this.httpService.get(API_GO_HOSTS.BIDS_OZON + '/companies', {
        headers: {
          'Client-Id': clientId,
          'Api-Key': apiKey,
        },
      }),
    );

    return data ?? [];
  }
}

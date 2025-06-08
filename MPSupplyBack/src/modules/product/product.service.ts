import {Injectable} from '@nestjs/common';
import {AutoCompleteDto} from 'src/dto/autocomplete.dto';
import {Op} from 'sequelize';
import {InjectModel} from '@nestjs/sequelize';
import {Product, ProductF} from './entities/product.entity';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {SettingsService} from '../settings/settings.service';
import {
    API_GO_HOSTS,
    MP,
    ProductAttributesResponseOzon,
    ProductsResponseWB,
    SETTINGS,
    SETTINGS_MODULE
} from 'src/main.types';
import {isEmpty} from 'class-validator';
import {Logger} from '@nestjs/common';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectModel(Product) private productRepository: typeof Product,
        private readonly httpService: HttpService,
        private readonly settingsService: SettingsService,
    ) {
    }

    async autocomplete(dto: AutoCompleteDto, cid: number) {
        const where = {
            [Op.or]: {
                name: {[Op.iLike]: '%' + dto.search + '%'},
                offer_id: {[Op.iLike]: '%' + dto.search + '%'},
            },
            cid,
        };

        const res = await this.productRepository.findAll({
            where: where,
            limit: dto.limit,
        });

        return res;
    }

    async findAllByMP(cid: number, mp: string) {
        return await this.productRepository.findAll({
            where: {cid, mp: mp},
        });
    }

    getVolume(item: ProductAttributesResponseOzon): number {
        const cubic = item.height * item.depth * item.width;
        switch (item.dimension_unit) {
            case 'mm':
                return cubic / 1000000;
            case 'cm':
                return cubic / 1000;
            case 'in':
                return cubic / 61.024;
            default:
                return cubic;
        }
    }

    async sync(cid: number) {
        this.logger.log(`Начало синхронизации для кабинета cid=${cid}`);
        const result = {
            [MP.Ozon]: await this.syncOzon(cid),
            [MP.WB]: await this.syncWB(cid),
        };
        this.logger.log(`Завершена синхронизация для кабинета cid=${cid}`, JSON.stringify(result));
        return result;
    }

    async syncOzon(cid: number) {
        const productIds: number[] = await this.getProductListOzon(cid);

        if (productIds === null || productIds.length === 0) {
            return {total: 0, new: 0};
        }

        const existIds = (
            await this.productRepository.findAll({
                attributes: [ProductF.FOREIGN_ID],
                where: {cid, mp: MP.Ozon},
            })
        ).map((el) => +el.foreignId);

        const newIds = productIds.filter((el) => existIds.indexOf(el) === -1);
        const oldIds = productIds.filter((el) => existIds.indexOf(el) !== -1);

        if (newIds.length > 0) {
            const newProducts = await this.getProductListInfoOzon(newIds, cid);
            if (newProducts) {
                await this.productRepository.bulkCreate(
                    newProducts.map((el: any) => ({
                        ...el,
                        cid,
                        sku: el.sources[0].sku,
                        barcode: el.barcodes[0],
                        foreignId: el.id,
                        id: null,
                        mp: MP.Ozon,
                    })),
                );
            }
        }

        if (oldIds.length > 0) {
            const oldProducts = await this.getProductListInfoOzon(oldIds, cid);

            if (oldProducts) {
                oldProducts.forEach((el) => {
                    this.productRepository.update(
                        {
                            name: el.name,
                            offer_id: el.offer_id,
                            barcode: el.barcodes[0],
                            sku: el.sources[0].sku,
                        },
                        {where: {foreignId: el.id, cid, mp: MP.Ozon}},
                    );
                });
            }
        }

        const products = await this.productRepository.findAll({
            attributes: [ProductF.FOREIGN_ID],
            where: {volume: null, cid, mp: MP.Ozon},
        });

        if (products) {
            const productAttributes = await this.getProductListAttributesOzon(
                products.map((el) => +el.foreignId),
                cid,
            );

            if (productAttributes) {
                productAttributes.forEach((el) => {
                    this.productRepository.update({volume: this.getVolume(el)}, {
                        where: {
                            foreignId: el.id,
                            cid,
                            mp: MP.Ozon
                        }
                    });
                });
            }
        }

        return {total: productIds.length, new: products.length};
    }

    async getProductListOzon(cid: number): Promise<number[]> {
        const clientId = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid);
        const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid);

        const {data} = await firstValueFrom(
            this.httpService.get(API_GO_HOSTS.SELLER_OZON + '/products', {
                headers: {
                    'Client-Id': clientId,
                    'Api-Key': apiKey,
                },
            }),
        );

        console.log(`OZON response for cid=${cid}:`, JSON.stringify(data, null, 2)); // красиво отформатировано

        return data;
    }

    async getProductListInfoOzon(ids: number[], cid: number) {
        let {data} = await firstValueFrom(
            this.httpService.post(
                API_GO_HOSTS.SELLER_OZON + '/products/info',
                {
                    product_id: ids,
                },
                {
                    headers: {
                        'Client-Id': await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid),
                        'Api-Key': await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid),
                    },
                },
            ),
        );

        return data;
    }

    async getProductListAttributesOzon(ids: number[], cid: number): Promise<ProductAttributesResponseOzon[]> {
        let {data} = await firstValueFrom(
            this.httpService.post(
                API_GO_HOSTS.SELLER_OZON + '/products/attributes',
                {
                    product_id: ids,
                },
                {
                    headers: {
                        'Client-Id': await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_CLIENT_ID, cid),
                        'Api-Key': await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.OZON_API_KEY, cid),
                    },
                },
            ),
        );

        return data;
    }

    async toArchive(id: number, cid: number) {
        await this.productRepository.update({inArchive: true}, {where: {id: id, cid}});
    }

    async fromArchive(id: number, cid: number) {
        await this.productRepository.update({inArchive: false}, {where: {id: id, cid}});
    }

    async notRequired(cid: number) {
        return await this.productRepository.findAll({
            where: {cid, inArchive: true},
        });
    }

    async syncWB(cid: number) {
        const existsBySku = (await this.findAllByMP(cid, MP.WB)).reduce((r, el) => {
            r[el.sku] = el;
            return r;
        }, {});

        const products = await this.getProductsWB(cid);

        await this.productRepository.bulkCreate(
            products
                .filter((el) => !(el.sku in existsBySku))
                .map((el) => ({
                    ...el,
                    cid,
                    mp: MP.WB,
                })),
        );

        return {total: products.length, new: products.filter((el) => !(el.sku in existsBySku)).length};
    }

    async getProductsWB(cid: number): Promise<ProductsResponseWB[]> {
        const apiKey = await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.WB_API_KEY, cid);

        if (isEmpty(apiKey)) return [];

        let {data} = await firstValueFrom(
            this.httpService.get(API_GO_HOSTS.SELLER_WB + '/products', {
                headers: {
                    Authorization: await this.settingsService.get(SETTINGS_MODULE.API, SETTINGS.WB_API_KEY, cid),
                },
            }),
        );

        return data ?? [];
    }
}

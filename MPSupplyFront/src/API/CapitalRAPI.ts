import { sendReq } from './SendRequest';

export default class CapitalRAPI {
    static LiabilitiesGetAll() {
        return sendReq('capital/liability');
    }

    static LiabilitiesCreate(data: any) {
        return sendReq(`capital/liability`, 'POST', data);
    }

    static LiabilitiesSave(id: number, data: any) {
        return sendReq(`capital/liability/${id}`, 'PATCH', data);
    }

    static LiabilitiesDelete(id: number) {
        return sendReq(`capital/liability/${id}`, 'DELETE', {});
    }

    static AssetsGetAll() {
        return sendReq('capital/assets');
    }
    static AssetsSave(type: string, data: any) {
        return sendReq(`capital/assets/${type}`, 'PATCH', data);
    }
}

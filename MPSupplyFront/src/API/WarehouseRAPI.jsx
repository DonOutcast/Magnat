import { sendReq } from "./SendRequest"

export default class WarehouseRAPI {
    static all(mp) {
        return sendReq('warehouses/mp/' + mp)
    }
    static update(id, data) {
        return sendReq("warehouses/" + id, 'PATCH', data)
    }
    static updateAll(data, mp) {
        return sendReq("warehouses/mp/" + mp, 'PATCH', data)
    }
}
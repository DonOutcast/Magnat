import { sendReq } from "./SendRequest"

export default class SupplierRAPI {
    static search(search, page = 1) {
        return sendReq('suppliers/?limit=20&search=' + search + '&page=' + page)
    }
    static add(data) {
        return sendReq('suppliers/', 'POST', data);
    }
    static set(data) {
        return sendReq('suppliers/' + data.id, 'PATCH', data);
    }
    static delete(id) {
        return sendReq('suppliers/' + id, 'DELETE');
    }
    static getById(id) {
        return sendReq('suppliers/' + id);
    }
}
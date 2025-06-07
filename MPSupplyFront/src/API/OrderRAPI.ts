import { sendReq } from './SendRequest';

export default class OrderRAPI {
    static getAll() {
        return sendReq('orders');
    }

    static get(id: number) {
        return sendReq(`orders/${id}`);
    }

    static create(items: any[]) {
        return sendReq(`orders`, 'POST', { items });
    }

    static save(id: number, items: any[]) {
        return sendReq(`orders/${id}`, 'PATCH', { items });
    }

    static remove(id: number) {
        return sendReq(`orders/${id}`, 'DELETE', {});
    }

    static setApproved(id: number) {
        return sendReq(`orders/approve/${id}`, 'POST', {});
    }
}

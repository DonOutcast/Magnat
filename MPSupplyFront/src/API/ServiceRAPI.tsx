import axios from "axios";
import { sendReq } from "./SendRequest";

export default class ServiceRAPI {
    static accept(serviceId: number) {
        return sendReq('item-services/' + serviceId + '/accept/', 'POST', {});
    }
    static async reject(serviceId: number, comment: string) {
        return (await axios.post('item-services/' + serviceId + '/reject/', {
            comment: comment
        })).data
    }
    static async setPrice(serviceId: number, price: number) {
        return (await axios.post('item-services/' + serviceId + '/price/', {
            price: price
        })).data
    }
    static async setLabel(serviceId: number, label: string) {
        return (await axios.post('item-services/' + serviceId + '/label/', {
            label: label
        })).data
    }
    static setMaster(serviceId: number, masterId: number) {
        return sendReq('item-services/' + serviceId + '/master/', 'POST', {masterId: masterId})
    }
    static addMaterial(serviceId: number, comment: string, price: number) {
        return sendReq('item-services/' + serviceId + '/material/', 'POST', {
            price: price,
            material: comment
        })
    }
    static addService(data: any) {
        return sendReq('item-services/', 'POST', data)
    }
    static recalcWODiscount(serviceId: number) {
        return sendReq('item-services/' + serviceId + '/recalc_wo_discount/')
    }

    static AllServices(groupId: number) {
        return sendReq('services/?group=' + groupId)
    }

    static AllServicesByGroup(groupId: number) {
        return sendReq('services/by_parent?group=' + groupId)
    }

    static Pupupu(serviceId: number) {
        return sendReq('services/' + serviceId)
    }
    static AddPupupu(params: any) {
        return sendReq('services/', 'POST', params)
    }
    static EditPupupu(id: number, params: any) {
        return sendReq('services/' + id, 'PATCH', params)
    }
    static Delete(serviceId: number) {
        return sendReq('services/' + serviceId, 'DELETE')
    }

    static WorkList(worker: string) {
        return sendReq('item-services/work_list/?worker=' + worker);
    }
    static WorkWOMaster(filter: string = 'all', page: number = 1, limit: number = 20) {
        return sendReq('item-services/appoint/?filter=' + filter + '&page=' + page + '&limit=' + limit);
    }

    static async AllSuppliers() {
        return (await axios.get('services/suppliers')).data
    }

    static async AddSuppliers(id: number, list: any[]) {
        return (await axios.post('item-services/' + id + '/supplier', {
            list: list
        })).data
    }
}
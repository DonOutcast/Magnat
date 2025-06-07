import { sendReq } from './SendRequest';
import axios from 'axios';
const FileDownload = require('js-file-download');

export default class ObservableRAPI {
    static search(search, page = 1) {
        return sendReq('observable/?limit=20&search=' + search + '&page=' + page);
    }
    static add(data) {
        return sendReq('observable/', 'POST', data);
    }
    static set(data) {
        return sendReq('observable/' + data.id, 'PATCH', data);
    }
    static getById(id) {
        return sendReq('observable/' + id);
    }
    static getByIdAnal(id) {
        return sendReq('observable/' + id + '/analytics');
    }
    static delete(id) {
        return sendReq('observable/' + id, 'DELETE');
    }

    static getStock(productId) {
        return sendReq('stock/byproduct/' + productId);
    }

    static getRequired() {
        return sendReq('stock/required');
    }

    static getBySaleSpeed(mp) {
        return sendReq(`stock/salespeed/${mp}`);
    }

    static setVisible(data) {
        return sendReq('stock/visible', 'POST', data);
    }

    static notRequired() {
        return sendReq('products/not_required');
    }

    static toArchive(id) {
        return sendReq(`products/${id}/to_archive`, 'POST', {});
    }

    static fromArchive(id) {
        return sendReq(`products/${id}/from_archive`, 'POST', {});
    }

    static generateCSV() {
        axios({
            url: 'observable/csv2',
            method: 'GET',
            responseType: 'blob', // Important
        }).then(response => {
            FileDownload(response.data, 'Supplies.xlsx');
        });
    }

    static getSupplierItems(id) {
        return sendReq('observable/supplier/' + id);
    }

    static searchWItems() {
        return sendReq('observable/witems');
    }

    static getWithStock(mps) {
        return sendReq('observable/wstock?mplaces=' + mps.join(','));
    }

    static getMany(ids) {
        return sendReq('observable/many?ids=' + ids.join('&ids='));
    }

    static getInOurStock() {
        return sendReq('observable/winourstock');
    }

    static setInOurStock(data) {
        return sendReq('observable/winourstock', 'PATCH', data);
    }

    static getInWay() {
        return sendReq('observable/winway');
    }

    static setInWay(data) {
        return sendReq('observable/winway', 'PATCH', data);
    }

    static uploadLabel(id, formData) {
        return sendReq('observable/label/' + id, 'POST_FILE', formData);
    }

    static downloadLabel(id) {
        window.open(axios.defaults.baseURL + 'observable/label/' + id, '_blank').focus();
    }
}

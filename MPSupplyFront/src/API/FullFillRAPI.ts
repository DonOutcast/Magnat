import { sendReq } from "./SendRequest";

export default class FullFillRAPI {
  static getAll() {
    return sendReq("full-fill");
  }

  static get(id: number, mp: string) {
    return sendReq(`full-fill/${id}/${mp}`);
  }

  static create(data: any) {
    return sendReq(`full-fill`, "POST", data);
  }

  static save(id: number, data: any) {
    return sendReq(`full-fill/${id}`, "PATCH", data);
  }

  static setApproved(id: number) {
    return sendReq(`full-fill/approve/${id}`, "POST", {});
  }

  static remove(id: number) {
    return sendReq(`full-fill/${id}`, "DELETE", {});
  }

  static getInDeliverySettings(id: number) {
    return sendReq(`full-fill/${id}/in_delivery`);
  }

  static setInDeliverySettings(id: number, data: any) {
    return sendReq(`full-fill/${id}/in_delivery`, "POST", data);
  }
}

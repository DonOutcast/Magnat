import { sendReq } from "./SendRequest";

export default class PaymentService {
  static getToday() {
    return sendReq("payments/today");
  }
  static newPayment(payment: {}) {
    return sendReq("payments", "POST", payment);
  }
  static editPayment(id: number, payment: {}) {
    return sendReq("payments/" + id, "PUT", payment);
  }
  static all(page: number) {
    return sendReq("payments?page=" + page);
  }
}

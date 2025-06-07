import { sendReq } from "./SendRequest";

export default class StatService {
  static getMain() {
    return sendReq("items-refs/stat/main");
  }
  static getIssues() {
    return sendReq("stat/issue_log");
  }
  static amIAuth() {
    return sendReq("auth/am_i_auth");
  }
  static logout() {
    // return sendReq('logout')
  }
  static auth(phone: string, password: string) {
    return sendReq("auth/login", "POST", {
      phone: phone,
      password: password,
    });
  }
  static getYear(year: number) {
    return sendReq("items-refs/stat/year?year=" + year);
  }

  static changeCabinet(id: number) {
    return sendReq(`auth/set/cabinet/${id}`);
  }

  static getSettings() {
    return sendReq(`settings`);
  }

  static setSettings(data: any) {
    return sendReq(`settings`, "PATCH", data);
  }
}

import { sendReq } from "./SendRequest"


export default class UserRAPI {
    static Create(newUser) {
        return sendReq('users/', 'POST', newUser)
    }

    static deactivate(id) {
        return sendReq('users/' + id + '/deactivate')
    }

    static GetList() {
        return sendReq('users/')
    }

    static Get(userId) {
        return sendReq('users/' + userId)
    }

    static GetSalaryInfo(userId, year, month) {
        return sendReq('users/' + userId + '/salary/' + year + '/' + month + '/')
    }

    static GetSalaryInfoMy(year, month) {
        return sendReq('users/mysalary/' + year + '/' + month + '/')
    }

    static addSalaryParam(userId, newParam) {
        return sendReq('users/' + userId + '/salary/param', 'POST', newParam)
    }

    static editUser(userId, params) {
        return sendReq('users/' + userId, 'POST', params)
    }

    static GetSchedule() {
        return sendReq('schedule')
    }
    static MoveSchedule(uid, from, to) {
        return sendReq('schedule/move/', 'POST', {
            userId: uid,
            from: from,
            to: to,
        })
    }
    static AddSchedule(uid, date) {
        return sendReq('schedule', 'POST', {
            userId: uid,
            date: date
        })
    }
    static RemoveSchedule(uid, date) {
        return sendReq('schedule/remove', 'POST', {
            userId: uid,
            date: date
        })
    }
}
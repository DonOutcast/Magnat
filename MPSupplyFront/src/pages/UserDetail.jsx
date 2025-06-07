import React, { useEffect, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import UserRAPI from "../API/UserRAPI";

const removeAtIndex = (arr, index) => {
    const copy = [...arr];
    copy.splice(index, 1);
    return copy;
};

const toggleArr = (arr, item, getValue = item => item) => {
const index = arr.findIndex(i => getValue(i) === getValue(item));
if (index === -1) return [...arr, item];
return removeAtIndex(arr, index);
};


export const UserDetail = () => {
    let {id} = useParams()
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null)

    async function fetch() {
        const res = await UserRAPI.Get(id)
        if (!res.error) {
            setUserData({...res, selectedRoles: res.roles.map(el => el.id)})
        }
    }

    async function saveUser() {
        await UserRAPI.editUser(id, userData)
    }

    useEffect(() => {
        fetch()
    }, [])

    async function deactivate() {
        const res = await UserRAPI.deactivate(id)
        if (!res.error) {
            navigate('/users')
        }
    }

    return (
        <div className="card">
            <div className="card-body">
                {userData &&
                <>
                    <h6>{userData && userData.fio}</h6>

                    <div className="row">
                        <div className="col-md-6 col-lg-4">
                            <div className="form-group">
                                <label>ФИО</label>
                                <input type="text" value={userData.fio} onChange={(e) => setUserData({...userData, fio: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Телефон</label>
                                <input type="text" value={userData.phone} onChange={(e) => setUserData({...userData, phone: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <input type="text" value={userData.newpass} onChange={(e) => setUserData({...userData, newpass: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <button onClick={saveUser} className="btn bg-gradient-primary m-3 ms-0">Сохранить</button>
                                <button onClick={deactivate} className="btn bg-gradient-danger m-3">Деактивировать</button>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-8">
                            <div className="form-group">
                                <label>Роли</label>
                            </div>
                            {userData && userData.allRoles.map(el =>
                                <div className="form-group">
                                    <div className="form-check form-switch my-auto">
                                        <input className="form-check-input" checked={userData.selectedRoles.includes(el.id)} type="checkbox"
                                        onChange={(e) => setUserData({...userData, selectedRoles: toggleArr(userData.selectedRoles, el.id)})}/>{el.desc}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* <div className="col-lg-3">
                            <div className="form-group">
                                <label>Доступы</label>
                            </div>
                        </div> */}
                    </div>
                </>
                }
            </div>
        </div>
    )
}
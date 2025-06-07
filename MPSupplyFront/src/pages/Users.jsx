import React, { useEffect, useState } from "react"
import UserRAPI from "../API/UserRAPI"
import {useNavigate} from "react-router-dom";
import Modal from "../components/UI/Modal";
import { toast } from "react-toastify";

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([])

    async function fetch() {
        const res = await UserRAPI.GetList();
        if (!res.error) {
            setUsers(res.filter(el => el.active))
        }
    }

    useEffect(() => {
        // fetch()
    }, [])

    const [newUserModal, setNewUserModal] = useState(false)

    const emptyUser = {
        fio: '',
        phone: '',
        password: '',
        role: 'manager'
    }

    const [newUser, setNewUser] = useState(emptyUser)

    async function createNewUser() {
        const res = await UserRAPI.Create(newUser)
        if (!res.error) {
            setNewUserModal(false)
            fetch()
            toast.success('Сотрудник успешно создан')
            setNewUser(emptyUser)
        }
    }

    return (
    <div className="card">
        <div className="mt-3 ms-3">
            {/* <button className="btn btn-icon bg-gradient-primary" onClick={() => setNewUserModal(true)}>
                Новый сотрудник
            </button> */}
        </div>
        <div className="table-responsive">
            <table className="table align-items-center mb-0">
                <thead>
                    <tr>
                        <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ФИО</th>
                        <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Роли</th>
                        <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Телефон</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(el =>
                    <tr onClick={() => navigate('/users/' + el.id)}>
                        <td>
                            <div className="d-flex px-2 py-1">
                                <div className="d-flex flex-column justify-content-center">
                                    <h6 className="mb-0 text-sm">{el.fio}</h6>
                                </div>
                            </div>
                        </td>
                        <td>
                            <p className="text-sm text-secondary mb-0">{el.roles.map(el => el.desc).join(', ')}</p>
                        </td>
                        <td className="align-middle text-center">
                            <span className="text-secondary text-sm">{el.phone}</span>
                        </td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>

        <Modal id="createUser" title="Добавить пользователя" onClose={() => setNewUserModal(false)} show={newUserModal}
               footerButtons={<button className="btn bg-gradient-success" type="button" onClick={createNewUser}>Добавить</button>}>
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">ФИО</label>
                <input type="text" className="form-control" id="exampleFormControlInput1"
                       placeholder="Иванов Иван" value={newUser.fio} onChange={(e) => setNewUser({...newUser, fio: e.target.value})}/>
            </div>
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">Телефон</label>
                <input type="number" className="form-control" id="exampleFormControlInput1"
                       placeholder="+79998887766" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})}/>
            </div>
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">Пароль</label>
                <input type="number" className="form-control" id="exampleFormControlInput1"
                       placeholder="123456" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}/>
            </div>
            <div className="form-group">
                <label>Роль</label>
                <select className={'form-control text-dark'} value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                    <option value="admin">Админ</option>
                </select>
            </div>
        </Modal>
    </div>
)}

export default Users;
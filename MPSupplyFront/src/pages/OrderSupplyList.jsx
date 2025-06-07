import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import {useTitle} from "../hooks/useTitle";
import moment from 'moment';
import 'moment/locale/ru';
import OrderRAPI from '../API/OrderRAPI';

const OrderSupplyList = () => {

    useTitle('Услуги')
    const [Service, setService] = useState([])
    const navigate = useNavigate();

    async function FetchData() {
        const res = await OrderRAPI.getAll()

        setService(res)
    }

    useEffect(() => {
        FetchData()
    }, [])

    async function deleteOrder(event, id) {
        event.preventDefault()
        event.stopPropagation()
        const res = await OrderRAPI.remove(id)
        if (!res.error) FetchData()
    }

    return (
        <div>
            <div className="row">
                <h3>Заказы</h3>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="card dataTable-wrapper">
                        <div className="table-responsive">
                            <table className="table align-items-center mb-0">
                                <thead>
                                    <tr>
                                        <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Номер</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата создания</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата редактирования</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {Service.length > 0 && Service.map((el) =>
                                    <tr onClick={() => navigate('/orders/' + el.id)}>
                                        <td className="text-center">#{el.id}</td>
                                        <td className="text-center">{moment(el.createdAt).format('LL LT')}</td>
                                        <td className="text-center">{moment(el.updatedAt).format('LL LT')}</td>
                                        <td className="text-center"><button className="btn bg-gradient-danger btn-sm" onClick={(e) => deleteOrder(e, el.id)}>Удалить</button></td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSupplyList;
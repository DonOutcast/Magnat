import React, {useEffect, useState} from 'react';
import {useFetching} from "../hooks/useFetching";
import '../css/OrderTR.module.css';
import {useNavigate} from "react-router-dom";
import {useTitle} from "../hooks/useTitle";
import ObservableRAPI from '../API/ObservableRAPI';
import { useProductIcon } from '../hooks/useProductIcon';

const Required = () => {
    useTitle('Заказы')
    const navigate = useNavigate();

    const [orders, setOrders] = useState<any[]>([])
    const [fetchData] = useFetching(async () => {
        const res = await ObservableRAPI.notRequired()

        setOrders(res)
    })

    useEffect(() => {
        fetchData()
    }, [])

    // Удалить из списка добавленнный товар
    async function deleteSelectedItem(el: any) {
        let buf = [...orders]
        const index = buf.indexOf(el);
        if (index > -1) {
            buf.splice(index, 1);
        }
        setOrders(buf)
    }

    async function fromArchive(el: any) {
        deleteSelectedItem(el)
        const res = await ObservableRAPI.fromArchive(el.id)
    }

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-flex flex-wrap justify-content-start">
                    <div className="ms-3">
                        <button className="btn btn-icon bg-gradient-primary" onClick={() => navigate('/observable/new/')}>
                            Новый товар
                        </button>
                    </div>
                </div>
            </div>
            <div className="col-md-12">
                <div className="card dataTable-wrapper">
                    <div className="table-responsive">
                        <table className="table align-items-center mb-0">
                            <thead>
                            <tr>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Наименование</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">SKU</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.length > 0 && orders.map((el) =>
                                <tr>
                                    <td style={{whiteSpace: 'normal'}}>{el.name}</td>
                                    <td className="text-center">{useProductIcon(el.mp)}{el.sku}</td>
                                    <td><button className="btn bg-gradient-info w-100 m-0" onClick={() => fromArchive(el)}>В товары</button></td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Required;
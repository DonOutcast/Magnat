import React, {useEffect, useState} from 'react';
import {useFetching} from "../hooks/useFetching";
import ClientRAPI from "../API/ClientRAPI";
import PaymentService from "../API/PaymentService";
import Moment from "moment/moment";
import {useNavigate} from "react-router-dom";

const Transacions = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([])
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        cur: 1,
        max: 10
    })

    const [fetchData, isLoading, errorData] = useFetching(async () => {
        const res = await PaymentService.all(page)
        if (!res.error) {
            setOrders(res.list)
            setPagination(res.pagination)
        }
    })

    const rows = [];
    for (let i = 1; i <= pagination.max; i++) {
        if (Math.abs(pagination.cur - i) <= 5 || i == pagination.max || i == 1) {
            if (Math.abs(pagination.cur - i) == 5) {
                rows.push(<li><a>...</a></li>);
            } else {
                rows.push(<li className={i == page ? 'active cp' : ' cp'} onClick={() => setPage(i)}><a>{i}</a></li>);
            }
        }
    }
    useEffect(() => {
        fetchData()
    }, [page])

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-sm-flex justify-content-start">
                    <div className="d-flex">
                        {/*<input type="text" className="form-control" placeholder="Поиск по клиентам" style={{height: '41px'}} onKeyPress={(e) => searchInput(e)}/>*/}
                    </div>
                    <div className="dataTable-wrapper ms-auto">
                        <div className="dataTable-bottom">
                            <nav className="dataTable-pagination">
                                <ul className="dataTable-pagination-list">
                                    {rows}
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md-12">
                <div className="card dataTable-wrapper">
                    <div className="table-responsive">
                        <table className="table align-items-center mb-0 text-center">
                            <thead>
                            <tr>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Время</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Сумма</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Тип</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Заказ</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Менеджер</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Клиент</th>
                                <th className="text-start text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2 w-70">Комментарий</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.length > 0 && orders.map((el) =>
                                <tr onClick={() => (el.orderId != null ? navigate('/orders/' + el.orderId) : '')}>
                                    <td>{Moment(el.createdAt).format('L, LT')}</td>
                                    <td><b>{Intl.NumberFormat("ru").format(el.amount)}</b></td>
                                    <td>{el.type}</td>
                                    <td>{el.orderId ? el.orderId : '-'}</td>
                                    <td>{el.user.fio}</td>
                                    <td>{el.order ? el.order.client.last_name: '-'}</td>
                                    <td className="text-start">{el.comment}</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="dataTable-bottom mt-4">
                        <nav className="dataTable-pagination">
                            <ul className="dataTable-pagination-list">
                                {rows}
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transacions;
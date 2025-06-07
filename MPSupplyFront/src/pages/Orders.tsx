import React, {useEffect, useState} from 'react';
import {useFetching} from "../hooks/useFetching";
import '../css/OrderTR.module.css';
import {useNavigate} from "react-router-dom";
import {useTitle} from "../hooks/useTitle";
import ObservableRAPI from '../API/ObservableRAPI';

const Orders = () => {
    useTitle('Заказы')
    const navigate = useNavigate();

    const [search, setSearch] = useState('')

    const [orders, setOrders] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        cur: 1,
        max: 1
    })

    const [fetchData, isLoading, errorData] = useFetching(async () => {
        const res = await ObservableRAPI.search(search, page)

        if (res.list.length === 1 && search !== '') {
            navigate('/orders/' + res.list[0].id)
        } else {
            setOrders(res.list)
            setPagination(res.pagination)
        }
    })

    const searchInput = async (event: any) => {
        if (event.key === "Enter") {
            setPage(1)
            setSearch(event.target.value)
        }
    }

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
    }, [search, page])

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-flex flex-wrap justify-content-start">
                    <div className="d-flex" style={{maxWidth: '150px'}}>
                        <input type="text" className="form-control" placeholder="Поиск по товарам" style={{height: '41px'}} onKeyPress={(e) => searchInput(e)}/>
                    </div>
                    <div className="ms-3">
                        <button className="btn btn-icon bg-gradient-primary" onClick={() => navigate('/observable/new/')}>
                            Новый товар
                        </button>
                    </div>
                    <div className="ms-3">
                        <button className="btn btn-icon bg-gradient-secondary" onClick={ObservableRAPI.generateCSV}>
                            Скачать CSV
                        </button>
                    </div>
                    {pagination.max !== 1 &&
                        <div className="dataTable-wrapper ms-auto">
                            <div className="dataTable-bottom">
                                <nav className="dataTable-pagination">
                                    <ul className="dataTable-pagination-list">
                                        {rows}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div className="col-md-12">
                <div className="card dataTable-wrapper">
                    <div className="table-responsive">
                        <table className="table align-items-center mb-0">
                            <thead>
                            <tr>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Наименование</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Цена за шт.</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Минимальный закуп</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Необходимо</th>
                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Кратно мин.</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.length > 0 && orders.map((el) =>
                                <tr onClick={() => navigate('/observable/' + el.id)}>
                                    <td>{el.name}</td>
                                    <td className="text-center">{Intl.NumberFormat("ru").format(el.price)}</td>
                                    <td className="text-center">{Intl.NumberFormat("ru").format(el.minCount)}</td>
                                    <td className="text-center">{Intl.NumberFormat("ru").format(el.need)}</td>
                                    <td className="text-center">{Intl.NumberFormat("ru").format(el.needmin)}</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {pagination.max !== 1 &&
                        <div className="dataTable-bottom mt-4">
                            <nav className="dataTable-pagination">
                                <ul className="dataTable-pagination-list">
                                    {rows}
                                </ul>
                            </nav>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default Orders;
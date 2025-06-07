import React, {useEffect, useState} from 'react';
import {useTitle} from "../hooks/useTitle";
import {useFetching} from "../hooks/useFetching";
import SupplierRAPI from "../API/SupplierRAPI";
import {toast} from "react-toastify";

const Suppliers = () => {
    useTitle('Поставщики')

    const [search, setSearch] = useState('')

    const [orders, setOrders] = useState([])
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        cur: 1,
        max: 1
    })

    const [fetchData] = useFetching(async () => {
        const res = await SupplierRAPI.search('', page)

        if (!res.error) {
            setOrders(res.list)
            setPagination(res.pagination)
        }
    })

    const searchInput = async (event) => {
        setSearch(event.target.value)
    }
    const rows = [];
    for (let i = 1; i <= pagination.max; i++) {
        if (Math.abs(pagination.cur - i) <= 5 || i === pagination.max || i === 1) {
            if (Math.abs(pagination.cur - i) === 5) {
                rows.push(<li><div>...</div></li>);
            } else {
                rows.push(<li className={i === page ? 'active cp' : ' cp'} onClick={() => setPage(i)}><div>{i}</div></li>);
            }
        }
    }
    useEffect(() => {
        fetchData()
    }, [page])

    // Изменение названия поставщика
    async function changeName(indx, value) {
        const newSuppliers = [...orders]
        newSuppliers[indx].name = value
        setOrders(newSuppliers)
        saveName(newSuppliers[indx])
    }

    async function saveName(el) {
        const res = await SupplierRAPI.set(el)

        if (!res.error) {
            toast.success('Изменения сохранены')
        }
    }

    // Создание нового поставщика
    async function createSupplier() {
        const res = await SupplierRAPI.add({name: search})

        if (!res.error) {
            toast.success('Поставщик создан')
            fetchData()
        }
    }

    // Supplier Delete
    async function deleteSupplier(id) {
        const res = await SupplierRAPI.delete(id)

        if (!res.error) {
            toast.success('Поставщик удален')
            fetchData()
        }
    }

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-sm-flex justify-content-start">
                    <div className="d-flex">
                        <input type="text" className="form-control" placeholder="Наименование поставщика" style={{height: '41px'}} onChange={(e) => searchInput(e)}/>
                    </div>
                    <div className="ms-3">
                        <button className="btn btn-icon bg-gradient-primary" onClick={createSupplier}>
                            Создать поставщика
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
                        <table className="table align-items-center mb-0 text-center">
                            <thead>
                            <tr>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ID</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Наименование</th>
                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Удалить</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.length > 0 && orders.map((el, indx) =>
                                <tr key={indx}>
                                    <td>{el.id}</td>
                                    <td>
                                        <div className="form-group m-0">
                                            <input type="text" value={el.name} className="form-control" onChange={(e) => changeName(indx, e.target.value)}/>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn bg-gradient-danger ms-3" onClick={() => deleteSupplier(el.id)}><i className="fas fa-trash"></i></button>
                                    </td>
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

export default Suppliers;
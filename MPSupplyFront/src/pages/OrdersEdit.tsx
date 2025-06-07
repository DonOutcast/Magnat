import React, { useEffect, useState } from 'react';
import { useFetching } from "../hooks/useFetching";
import '../css/OrderTR.module.css';
import { useNavigate } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import ObservableRAPI from '../API/ObservableRAPI';
import { toast } from "react-toastify";
import Modal from "../components/UI/Modal";
import { useProductIcon } from '../hooks/useProductIcon';

const OrdersEdit = () => {
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
        const res = await ObservableRAPI.searchWItems()

        setOrders(res)
    })

    const searchInput = async (event: any) => {
        setSearch(event.target.value)
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
    }, [])


    // Просмотр по складам
    const [stockModal, setStockModal] = useState(false)
    const [stock, setStock] = useState<any[]>([])
    const [stockTitle, setStockTitle] = useState('')

    async function getStock(productId: number, offerId: string) {
        setStock([])
        setStockModal(true)
        const res = await ObservableRAPI.getStock(productId)

        setStock(res)
        setStockTitle(offerId)
    }


    // Изменение видимости склада
    async function changeVisible(indx: number) {
        const newStock = [...stock]
        newStock[indx].visible = !newStock[indx].visible
        setStock(newStock)
        saveVisible(newStock[indx])
    }

    async function saveVisible(el: any) {
        const res = await ObservableRAPI.setVisible({ warehouse_name: el.name, visible: el.visible, sku: el.sku.toString() })

        if (!res.error) {
            toast.success('Изменения сохранены')
        }
    }

    // Выгрузка этикетки
    async function handleSubmit(event: any) {
        if (event.target) {
            const formData = new FormData();
            formData.append('file', event.target.files[0]);

            const res = await ObservableRAPI.uploadLabel(event.target.name, formData)

            if (!res.error) {
                fetchData()
                toast.success('Этикетка успешно загружена')
            }
        }
    }

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-flex flex-wrap justify-content-start">
                    <div className="d-flex" style={{ maxWidth: '150px' }}>
                        <input type="text" className="form-control" placeholder="Поиск по товарам" style={{ height: '41px' }} onChange={(e) => searchInput(e)} />
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
                    <div className="table-responsive" style={{ overflow: 'auto', height: "calc(100vh - 170px)" }}>
                        <table className="table align-items-center mb-0 th-sticky">
                            <thead>
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Товар</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Артикул</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">SKU</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Штрихкод</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Изменить штрихкод</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Склады</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 && orders.filter(f =>
                                    f.name.toLowerCase().includes(search.toLowerCase())
                                    || f.items.filter((elem: any) =>
                                        elem.product.offer_id.toLowerCase().includes(search.toLowerCase())
                                        || elem.product.sku.toLowerCase().includes(search.toLowerCase())
                                    ).length > 0
                                ).map((el: any) =>
                                    <>
                                        <tr>
                                            <td className="text-wrap" style={{ cursor: 'pointer' }} rowSpan={el.items.length + 1} onClick={() => navigate('/observable/' + el.id)} >{el.name}</td>
                                        </tr>
                                        {el.items && el.items.length > 0 && el.items.map((elem: any) =>
                                            <tr>
                                                <td>{useProductIcon(elem.product.mp)}{elem.product.offer_id}</td>
                                                <td>{elem.product.sku}</td>
                                                <td>{elem.barcodePath ? <span style={{color: 'var(--bs-indigo)', cursor: 'pointer'}} onClick={() => ObservableRAPI.downloadLabel(elem.id)}>{elem.product.barcode}</span> : elem.product.barcode}</td>
                                                <td>
                                                    <input type="file" onChange={handleSubmit} name={elem.id}/>
                                                </td>
                                                <td><div className="btn bg-gradient-primary w-100 m-0" onClick={() => getStock(elem.product.id, elem.product.offer_id)}>Настроить</div></td>
                                            </tr>
                                        )}
                                    </>
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

            <Modal title={stockTitle} id="stock" show={stockModal} onClose={() => setStockModal(false)} addClass="modal-100">
                {stock.length > 0 &&
                    <div style={{ margin: '-1rem' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Склад</th>
                                    <th>Видимость</th>
                                    <th>В пути</th>
                                    <th>В продаже</th>
                                    <th>В резерве</th>
                                    <th>Ср. скорость продаж</th>
                                    <th>Необходимо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stock.length > 0 && stock.map((el, indx) =>
                                    <tr className={el.visible ? '' : 'text-secondary'}>
                                        <td>{el.name}</td>
                                        <td>
                                            <div className="form-check form-switch" style={{ width: 'fit-content', margin: '0 auto' }}>
                                                <input className="form-check-input" checked={el.visible} type="checkbox" id="flexSwitchCheckDefault1" onChange={() => changeVisible(indx)} />
                                            </div>
                                        </td>
                                        <td>{el.promised_amount}</td>
                                        <td>{el.free_to_sell_amount}</td>
                                        <td>{el.reserved_amount}</td>
                                        <td>{Intl.NumberFormat("ru").format(el.avg_sale)}</td>
                                        <td>{el.needed > 0 ? <b>{el.needed}</b> : el.needed}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                }
            </Modal>
        </div>
    );
};

export default OrdersEdit;
import React, { useEffect, useState } from 'react';
import { useFetching } from "../hooks/useFetching";
import '../css/OrderTR.module.css';
import { useNavigate } from "react-router-dom";
import { useTitle } from "../hooks/useTitle";
import ObservableRAPI from '../API/ObservableRAPI';
import { toast } from "react-toastify";
import Modal from "../components/UI/Modal";
import Tooltip from '@mui/material/Tooltip';
import Moment from 'moment';
import { useProductIcon } from '../hooks/useProductIcon';

const wsStyleTitle = {alignment: {horizontal: 'center'}, font: {bold: true}}

async function tableToXLSX(fileName: string, target: any) {
    // @ts-ignore
    let workbook = window.XLSX.utils.book_new();
    const myDOM = target.cloneNode(true)
    await myDOM.querySelectorAll('[data-del="true"]').forEach((elem: any) => elem.remove());
    await myDOM.querySelectorAll('[data-del-colspan]').forEach((elem: any) => elem.colSpan = elem.dataset.delColspan);

    // @ts-ignore
    let ws = window.XLSX.utils.table_to_sheet(myDOM)

    let wsName = ws.A1.v
    ws.A1.s = ws.B1.s = ws.C1.s = ws.D1.s = ws.E1.s = ws.F1.s = ws.G1.s = wsStyleTitle

    // ws["!rows"] = [];
    ws["!cols"][0] = {wch: 50};
    ws["!cols"][1] = {wch: 15};
    ws["!cols"][4] = {wch: 16};
    ws["!cols"][5] = {wch: 10};
    ws["!cols"][6] = {wch: 16};

    // let titleNumbers = ws["!merges"].map((el:any) => (el.s.r + 1))

    // titleNumbers.forEach((num: number) => {
    //     ws['A' + num].s = wsStyleTitle
    // })

    // @ts-ignore
    window.XLSX.utils.book_append_sheet(workbook, ws, wsName);

    // @ts-ignore
    window.XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

const OrdersNeeded = () => {
    useTitle('Заказы')
    const navigate = useNavigate();
    const [selected, setSelected] = useState<number[]>([])

    const [search, setSearch] = useState('')

    const [orders, setOrders] = useState<any[]>([])
    const [WHS, setWHS] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        cur: 1,
        max: 1
    })

    // Переключение маркетплейсов
    const MPs = [
        { title: 'Ozon', value: 'ozon' },
        { title: 'WB', value: 'wb' }
    ]
    const [MPlaces, setMPlaces] = useState<string[]>(MPs.map(el => el.value))
    const toggleMPlaces = (mp: string) => {
        let mps = [...MPlaces]
        var index = mps.indexOf(mp);
        if (index !== -1) {
            mps.splice(index, 1);
        } else {
            mps.push(mp)
        }
        setMPlaces(mps)
    }

    const [fetchData, isLoading, errorData] = useFetching(async () => {
        const res = await ObservableRAPI.getWithStock(MPlaces)

        if (!res.error) {
            setOrders(res.obsItems)
            setWHS(res.warehouses)
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
    }, [search, page, MPlaces])


    // Просмотр по складам
    const [stockModal, setStockModal] = useState(false)
    const [stock, setStock] = useState<any[]>([])

    async function getStock(productId: number) {
        setStock([])
        setStockModal(true)
        const res = await ObservableRAPI.getStock(productId)

        setStock(res)
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

    // Выбор товара
    async function selectItem(id: number) {
        const index = selected.indexOf(id)

        if (index != -1) {
            setSelected(selected.filter(el => el!= id))
        } else {
            setSelected([...selected, id])
        }
    }

    // Итог по выбранным
    function totalSelected() {
        return orders.length > 0 && selected.length > 0? orders
            .filter(el => selected.includes(el.id))
            .reduce((acc, el) => acc + getTotal(el) * el.price, 0) : 0
    }

    // Итог по всем
    function totalAll() {
        return orders.length > 0? orders.reduce((acc, el) => acc + getTotal(el) * el.price, 0) : 0
    }

    function getTotal(item: any) {
        return Math.ceil((item.totalNeed > 0 ? item.totalNeed : 0) / item.minCount) * item.minCount
    }

    // Переключение видимости
    const [viewName, setViewName] = useState(true)

    const toggleViewName = () => {
        setViewName(!viewName)
    }
    const [viewWH, setViewWH] = useState(false)

    const toggleViewWH = () => {
        setViewWH(!viewWH)
    }

    function viewNeeded(item: any) {
        return `${item.need} необходимо\n${item.inOurStock} на складе\n${item.stockReserve} запас для склада\n`
    }

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-flex flex-wrap justify-content-start">
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
                    <div className="d-flex flex-wrap justify-content-start mt-3 ms-3">
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" id={'flexSwitchCheck_none'} checked={viewName} onChange={toggleViewName}/>
                            <label className="form-check-label" htmlFor={'flexSwitchCheck_none'}>Наименование</label>
                        </div>
                        <div className="form-check form-switch ms-3">
                            <input className="form-check-input" type="checkbox" id={'flexSwitchCheck_cons'} checked={viewWH} onChange={toggleViewWH}/>
                            <label className="form-check-label" htmlFor={'flexSwitchCheck_cons'}>Склады</label>
                        </div>
                        {MPs.map(el =>
                            <div className="form-check form-switch ms-3">
                                <input className="form-check-input" type="checkbox" id={'flexSwitchCheck_' + el.value} checked={MPlaces.includes(el.value)} onChange={() => toggleMPlaces(el.value)}/>
                                <label className="form-check-label" htmlFor={'flexSwitchCheck_' + el.value}>{el.title}</label>
                            </div>
                        )}
                    </div>
                    <div className="table-responsive" style={{ overflow: 'auto', height: "calc(100vh - 230px)" }}>
                        <table className="table align-items-center mb-0 th-sticky">
                            <thead>
                                <tr>
                                    {viewName && <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Товар</th>}
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Артикул</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Фасовка</th>
                                    {viewWH && WHS.filter(wh => wh.visible).map(wh =>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">{wh.shortName}</th>
                                    )}
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Итого</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Итого по товару</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Мин.заказ/кратность</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Сумма по товару</th>
                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" data-del="true">В заказ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 && orders.map((el) =>
                                    <>
                                        {el.items && el.items.length > 0 && el.items.map((elem: any, indx: number) =>
                                            <tr>
                                                {viewName &&
                                                    <>{indx === 0 ? <td className="text-wrap" rowSpan={el.items.length}>{el.name}</td> : <></>}</>
                                                }
                                                <td>{useProductIcon(elem.product.mp)}{elem.product.offer_id}</td>
                                                <td>{elem.packing}</td>
                                                {viewWH && WHS.filter(wh => wh.visible).map(wh =>
                                                    <td>{wh.priority in elem.stock && elem.stock[wh.priority] > 0 ? elem.stock[wh.priority] : '-'}</td>
                                                )}
                                                <td>{elem.needed}</td>
                                                {indx === 0 ? <td rowSpan={el.items.length} style={{position: 'relative'}}>
                                                    <Tooltip placement='right' title={<span style={{ whiteSpace: 'pre-line' }}>{viewNeeded(el)}</span>}>
                                                        <div style={{width: '100%', height: '100%', textAlign: 'center', position: 'absolute', top: 0, left: 0, display: 'flex'}}>
                                                            <div style={{margin: 'auto'}}>
                                                                {el.totalNeed > 0 ? el.totalNeed : 0}
                                                            </div>
                                                        </div>
                                                    </Tooltip>
                                                </td> : <></>}
                                                {indx === 0 ? <td rowSpan={el.items.length}>{el.minCount}</td> : <></>}
                                                {indx === 0 ? <td rowSpan={el.items.length}>
                                                    <span style={{display: 'none'}}>{getTotal(el) * el.price}</span>
                                                    <span data-del="true">{Intl.NumberFormat("ru").format(getTotal(el) * el.price)}</span>
                                                    </td> : <></>}
                                                {indx === 0 ? <td  data-del="true" rowSpan={el.items.length} style={{margin: 0, padding: 0}} className="text-center">
                                                    <input
                                                        checked={selected.indexOf(el.id) != -1}
                                                        type="checkbox"
                                                        style={{width: '2rem', height: '2rem'}}
                                                        onChange={() => selectItem(el.id)}
                                                    />
                                                </td> : <></>}
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-4 text-end me-2">
                            <p>
                                Выбрано: <b>{selected.length}</b>
                            </p>
                            <p>
                                Итого по выбранным: <b>{Intl.NumberFormat("ru").format(totalSelected())}</b>
                            </p>
                            <p>
                                Итого: <b>{Intl.NumberFormat("ru").format(totalAll())}</b>
                            </p>
                        </div>
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
                <button
                    className="btn btn-icon bg-gradient-success mt-4 float-end mb-0"
                    onClick={() => navigate('/orders/new?ids=' + selected.join('&ids='))}
                >
                    Отправить в заказ
                </button>

                <button className="btn btn-icon bg-gradient-primary mt-4 me-3 float-end" onClick={() => tableToXLSX('Потребность_' + Moment().format('Y.MM.DD'), document.querySelector('table'))}>
                    Скачать все
                </button>
            </div>

            <Modal title="Склады" id="stock" show={stockModal} onClose={() => setStockModal(false)} addClass="modal-100">
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

export default OrdersNeeded;
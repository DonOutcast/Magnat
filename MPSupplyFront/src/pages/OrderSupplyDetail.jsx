import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ObservableRAPI from '../API/ObservableRAPI';
import moment from 'moment';
import 'moment/locale/ru';
import OrderRAPI from '../API/OrderRAPI';

const wsStyleTitle = { alignment: { horizontal: 'center' }, font: { bold: true } };

async function tableToXLSX(fileName, target) {
    let workbook = window.XLSX.utils.book_new();
    const myDOM = target.cloneNode(true);
    await myDOM.querySelectorAll('[data-del="true"]').forEach(elem => elem.remove());
    await myDOM.querySelectorAll('[data-del-colspan]').forEach(elem => (elem.colSpan = elem.dataset.delColspan));
    let ws = window.XLSX.utils.table_to_sheet(myDOM);
    let wsName = ws.A1.v;

    ws['!cols'][0] = { wch: 26 };
    ws.A1.s = wsStyleTitle;

    window.XLSX.utils.book_append_sheet(workbook, ws, wsName);
    window.XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

const OrderSupplyDetail = () => {
    let { id } = useParams();
    const queryParams = new URLSearchParams(window.location.search);
    const navigate = useNavigate();

    const emptyOrder = {
        bySupplier: [],
    };

    const [order, setOrder] = useState(emptyOrder);

    async function fetchOrder() {
        const res = await OrderRAPI.get(id);
        if (!res.error) {
            const bySupplier = res.items.reduce((acc, item) => {
                const sid = item.supplier.id;
                if (!(sid in acc)) {
                    acc[sid] = { ...item.supplier, items: [] };
                }

                const orderItem = {
                    id: item.id,
                    name: item.name,
                    minCount: item.minCount,
                    needed: Math.max(item.needed, 0),
                    additional: item.additional,
                    price: item.price,
                    supplierId: item.supplier.id,
                };

                acc[sid].items.push(orderItem);
                return acc;
            }, {});

            setOrder({ id: res.id, createdAt: res.createdAt, bySupplier: Object.values(bySupplier), approved: res.approved });
        }
    }

    async function saveOrder() {
        const items = order.bySupplier
            .map(function(supplier) {
                return supplier.items;
            })
            .reduce((acc, arr) => acc.concat(arr), []);

        if (id === 'new') {
            const res = await OrderRAPI.create(items);
            if (!res.error) navigate('/orders/' + res.id);
        } else {
            const res = await OrderRAPI.save(id, items);
            if (!res.error) toast.success('Данные успешно сохранены');
        }
    }

    async function getObs(ids) {
        const res = await ObservableRAPI.getMany(ids);
        if (!res.error) {
            const bySupplier = res.reduce((acc, item) => {
                const sid = item.supplier.id;
                if (!(sid in acc)) {
                    acc[sid] = { ...item.supplier, items: [] };
                }

                const orderItem = {
                    name: item.name,
                    minCount: item.minCount,
                    needed: Math.max(item.totalNeed, 0),
                    additional: 0,
                    price: item.price,
                    supplierId: item.supplier.id,
                };

                acc[sid].items.push(orderItem);
                return acc;
            }, {});

            setOrder({ bySupplier: Object.values(bySupplier) });
        }
    }

    const [sum, setSum] = useState(0);
    useEffect(() => {
        if (order.bySupplier.length > 0) {
            let total = 0;
            order.bySupplier.forEach(function(supplier) {
                supplier.items.forEach(function(item) {
                    total += getTotal(item) * item.price;
                });
            });
            setSum(total);
        }
    }, [order]);

    useEffect(() => {
        if (queryParams.getAll('ids').length > 0) {
            getObs(queryParams.getAll('ids'));
        }
        if (id !== 'new') {
            fetchOrder();
        }
    }, [id]);

    function getTotal(item) {
        return Math.ceil((item.needed + item.additional) / item.minCount) * item.minCount;
    }

    function setAdditional(sindx, indx, value) {
        const item = order.bySupplier[sindx].items[indx];
        item.additional = value;

        const orderCopy = { ...order };
        orderCopy.bySupplier[sindx].items[indx] = item;

        setOrder(orderCopy);
    }

    async function setApproved() {
        const res = await OrderRAPI.setApproved(order.id);

        if (!res.error) {
            toast.success('Заказ принят');
            setOrder({ ...order, approved: true });
        }
    }

    // function bySupplierData(indx) {
    //     const supplier = order.bySupplier[indx]
    //     const items = supplier.items.map((item) => ({
    //         name: item.name,
    //         minCount: item.minCount,
    //         needed: item.needed,
    //         additional: item.additional,
    //         price: item.price,
    //         supplierId: item.supplierId,
    //     }))

    //     return JSON.stringify(items)
    // }

    async function downloadAllOrder() {
        order.bySupplier.forEach((el, sindx) => {
            tableToXLSX(`${order.id}_${el.name}`, document.querySelector(`[data-table="${sindx}"]`));
        });
    }

    return (
        <div>
            <h3>{order.id ? `Заказ #${order.id} от ${moment(order.createdAt).format('LL LT')}` : 'Новый заказ'}</h3>
            <div className="row"></div>
            <div className="row mt-4">
                <div className="col-md-12">
                    {order.bySupplier &&
                        order.bySupplier.map((el, sindx) => (
                            <div className="card mt-4" style={{ overflow: 'auto' }}>
                                <table className="table text-center" data-table={sindx}>
                                    <thead>
                                        <tr className="bg-light">
                                            <th data-del-colspan={5} colSpan={7}>
                                                {el.name}{' '}
                                                <i
                                                    style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                                                    onClick={() => tableToXLSX(`${order.id}_${el.name}`, document.querySelector(`[data-table="${sindx}"]`))}
                                                    class="fas fa-file-export float-end"
                                                ></i>
                                            </th>
                                        </tr>
                                        <tr>
                                            <th style={{ width: '50%' }}>Товар</th>
                                            <th>Мин.заказ</th>
                                            <th data-del="true">Потребность</th>
                                            <th data-del="true">Добавить</th>
                                            <th>Итого</th>
                                            <th>Цена</th>
                                            <th>Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {el.items.map((item, indx) => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{item.minCount}</td>
                                                <td data-del="true">{item.needed}</td>
                                                <td data-del="true">
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={item.additional}
                                                        onChange={e => setAdditional(sindx, indx, parseInt(e.target.value))}
                                                    />
                                                    <span hidden="true">{item.additional}</span>
                                                </td>
                                                <td>{getTotal(item)}</td>
                                                <td>{item.price}</td>
                                                <td>{getTotal(item) * item.price}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td data-del-colspan={4} colSpan={6} className="text-end" style={{ textAlign: 'right' }}>
                                                <b>Итого:</b>
                                            </td>
                                            <td>{el.items.reduce((sum, item) => sum + getTotal(item) * item.price, 0)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}

                    <button className="btn btn-icon bg-gradient-success mt-4 float-end ms-3" onClick={saveOrder}>
                        Сохранить
                    </button>

                    {!order.approved && id !== 'new' && (
                        <button className="btn btn-icon bg-gradient-primary mt-4 float-end ms-3" onClick={setApproved}>
                            Принять
                        </button>
                    )}
                    <button className="btn btn-icon bg-gradient-primary mt-4 float-end" onClick={downloadAllOrder}>
                        Скачать все
                    </button>
                    <div className="text-secondary float-end me-3 mt-4 text-bold" style={{ lineHeight: '2.5' }}>
                        Итого: {Intl.NumberFormat('ru').format(sum)} р.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSupplyDetail;

import React, { DOMElement, useEffect, useState } from 'react';
import { useFetching } from '../hooks/useFetching';
import '../css/OrderTR.module.css';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import ObservableRAPI from '../API/ObservableRAPI';
import { toast } from 'react-toastify';

const wsStyleTitle = { alignment: { horizontal: 'center' }, font: { bold: true } };

async function tableToXLSX(fileName: string) {
    let tables = document.querySelectorAll('table');

    let fisrtTable = document.createElement('table');

    tables.forEach((table, indx) => {
        if (indx != 0) {
            // return;
        }

        fisrtTable.append(table.cloneNode(true));
    });
    // @ts-ignore
    let workbook = window.XLSX.utils.book_new();
    const myDOM = fisrtTable;
    await myDOM.querySelectorAll('[data-del="true"]').forEach(elem => elem.remove());
    await myDOM.querySelectorAll('[data-del-colspan]').forEach((elem: any) => (elem.colSpan = elem.dataset.delColspan));

    // @ts-ignore
    let ws = window.XLSX.utils.table_to_sheet(myDOM);

    let wsName = ws.A1.v;
    ws['!rows'] = [];
    ws['!cols'][0] = { wch: 50 };
    ws['!cols'][1] = { wch: 11 };
    ws['!cols'][2] = { wch: 15 };

    let titleNumbers = ws['!merges'].map((el: any) => el.s.r + 1);

    titleNumbers.forEach((num: number) => {
        ws['A' + num].s = wsStyleTitle;
    });

    // @ts-ignore
    window.XLSX.utils.book_append_sheet(workbook, ws, wsName);

    // @ts-ignore
    window.XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

const OrderInWay = () => {
    useTitle('Остатки');
    const navigate = useNavigate();

    const [orders, setOrders] = useState<any[]>([]);

    const [fetchData, isLoading, errorData] = useFetching(async () => {
        const res = await ObservableRAPI.getInWay();

        const orderBySupplier: any = {};
        res.forEach((el: any) => {
            if (!(el.supplierId in orderBySupplier)) {
                orderBySupplier[el.supplierId] = {
                    supplierId: el.supplierId,
                    name: el.supplier.name,
                    items: [],
                };
            }
            orderBySupplier[el.supplierId].items.push({ ...el, add: 0 });
        });

        setOrders(Object.values(orderBySupplier));
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function saveStock() {
        let items: any[] = [];

        orders.forEach(supplier => {
            supplier.items.forEach((item: any) => {
                items.push({
                    id: item.id,
                    inWay: item.inWay,
                });
            });
        });

        const res = await ObservableRAPI.setInWay(items);

        if (!res.error) {
            toast.success('Сохранено');
            fetchData();
        } else {
            toast.error('Ошибка при сохранении');
        }
    }

    function setInWay(sindx: number, indx: number, inWay: number) {
        const orderCopy = [...orders];
        orderCopy[sindx].items[indx].inWay = inWay;

        setOrders(orderCopy);
    }

    // Поиск
    const [search, setSearch] = useState('');

    // Сброс
    function clearAdd() {
        const orderCopy = [...orders];
        orderCopy.forEach((supplier, sindx) => {
            supplier.items.forEach((item: any, indx: number) => {
                orderCopy[sindx].items[indx].inWay = 0;
            });
        });

        setOrders(orderCopy);
    }

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-flex flex-wrap justify-content-start">
                    <div className="d-flex" style={{ maxWidth: '150px' }}>
                        <input type="text" className="form-control" placeholder="Поиск по товарам" style={{ height: '41px' }} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="col-md-12">
                {orders
                    .filter((order: any) => order.items.filter((f: any) => f.name.toLowerCase().includes(search.toLowerCase())).length > 0)
                    .map((supplier, sindx: number) => (
                        <div className="card dataTable-wrapper mt-4" key={sindx}>
                            <div className="table-responsive">
                                <table className="table align-items-center">
                                    <thead>
                                        <tr>
                                            <th data-del-colspan={3} colSpan={5} className="text-center">
                                                {supplier.name}
                                            </th>
                                        </tr>
                                        <tr>
                                            <th style={{ width: '70%' }} className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                                                Наименование
                                            </th>
                                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Цена за шт.</th>
                                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" data-del="true">
                                                В пути
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplier.items.length > 0 &&
                                            supplier.items
                                                .filter((f: any) => f.name.toLowerCase().includes(search.toLowerCase()))
                                                .map((el: any, indx: number) => (
                                                    <tr key={indx}>
                                                        <td className="text-wrap">{el.name}</td>
                                                        <td className="text-center">
                                                            <span style={{ display: 'none' }}>{el.price}</span>
                                                            <span data-del="true">{Intl.NumberFormat('ru').format(el.price)}</span>
                                                        </td>
                                                        <td className="text-center" data-del="true">
                                                            <input
                                                                type="number"
                                                                style={{ width: '100px' }}
                                                                className="form-control"
                                                                value={el.inWay}
                                                                onChange={e => setInWay(sindx, indx, parseInt(e.target.value))}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                        <tr style={{ display: 'none' }}>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                <button className="btn bg-gradient-success float-end mt-4" onClick={saveStock}>
                    Сохранить
                </button>
                <button className="btn bg-gradient-primary float-end mt-4 me-3" onClick={() => tableToXLSX('all')}>
                    Скачать
                </button>
                <button className="btn bg-gradient-primary float-end mt-4 me-3" onClick={clearAdd}>
                    Сбросить все
                </button>
            </div>
        </div>
    );
};

export default OrderInWay;

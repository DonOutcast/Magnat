import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/ru';
import FullFillRAPI from '../API/FullFillRAPI';
import WarehouseRAPI from '../API/WarehouseRAPI';
import { toast } from 'react-toastify';
import { useProductIcon } from '../hooks/useProductIcon';

function jsonValue(elem) {
    try {
        let el = JSON.parse(elem.v);
        if (!isNaN(el)) return elem;
        return el;
    } catch (e) {
        return elem;
    }
}

const wsStyleTitle = { alignment: { horizontal: 'center' }, font: { bold: true } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function tableToXLSX(fileName, target, whLen) {
    let workbook = window.XLSX.utils.book_new();
    let myDOM = target.cloneNode(true);
    await myDOM.querySelectorAll('[data-del="true"]').forEach(elem => elem.remove());
    await myDOM.querySelectorAll('[data-del-colspan]').forEach(elem => (elem.colSpan = elem.dataset.delColspan));
    let ws = window.XLSX.utils.table_to_sheet(myDOM);
    let wsName = 'Общее';

    ws['!cols'][0] = { wch: 22 };
    ws['!cols'][1] = { wch: 10 };
    ws['!cols'][2] = { wch: 22 };
    ws['!cols'][3] = { wch: 14 };
    ws['!cols'][4] = { wch: 14 };
    ws['!cols'][whLen + 7] = { wch: 12 };
    ws['!cols'][whLen + 8] = { wch: 15 };
    ws['!cols'][whLen + 9] = { wch: 12 };
    ws['!cols'][whLen + 10] = { wch: 13 };

    let newWS = {};
    Object.keys(ws).forEach(k => {
        newWS[k] = jsonValue(ws[k]);
    });

    ws = newWS;

    ws.A1.s = wsStyleTitle;
    ws.B1.s = wsStyleTitle;
    ws.C1.s = wsStyleTitle;
    ws.D1.s = wsStyleTitle;
    ws.E1.s = wsStyleTitle;
    ws.F1.s = wsStyleTitle;
    if (whLen === 19) {
        ws.Z1.s = wsStyleTitle;
        ws.AA1.s = wsStyleTitle;
        ws.AB1.s = wsStyleTitle;
        ws.AC1.s = wsStyleTitle;
    }

    window.XLSX.utils.book_append_sheet(workbook, ws, wsName);

    myDOM = target.cloneNode(true);
    await myDOM.querySelectorAll('[data-del="true"]').forEach(elem => elem.remove());
    await myDOM.querySelectorAll('[data-del-wh="true"]').forEach(elem => elem.remove());
    await myDOM.querySelectorAll('[data-del-colspan]').forEach(elem => (elem.colSpan = elem.dataset.delColspan));

    await myDOM.querySelectorAll('thead [data-wh]').forEach(wh => {
        wsName = wh.dataset.wh;
        let whMyDOM = myDOM.cloneNode(true);
        whMyDOM.querySelectorAll('[data-wh]:not([data-wh="' + wsName + '"])').forEach(elem => elem.remove());
        whMyDOM.querySelectorAll('tbody tr').forEach(elem => {
            let data = elem.querySelector('[data-wh="' + wsName + '"]');

            if (data && data.innerText === '') {
                elem.remove();
            }
        });

        if (whMyDOM.querySelectorAll('tbody tr').length === 0) {
            return;
        }

        ws['!cols'][0] = { wch: 22 };
        ws['!cols'][1] = { wch: 14 };
        ws.A1.s = wsStyleTitle;
        ws.B1.s = wsStyleTitle;
        ws.C1.s = wsStyleTitle;
        ws.D1.s = wsStyleTitle;
        ws.E1.s = wsStyleTitle;

        ws = window.XLSX.utils.table_to_sheet(whMyDOM);
        window.XLSX.utils.book_append_sheet(workbook, ws, wsName);
    });

    window.XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

const OrderFullFillDetail = () => {
    let { id } = useParams();

    const queryParams = new URLSearchParams(window.location.search);
    const marketPlace = queryParams.get('mp') || 'ozon';
    const navigate = useNavigate();

    const emptyOrder = {
        byObs: [],
    };

    const [OrderIsEdited, setOrderIsEdited] = useState(true);
    const [order, setOrder] = useState(emptyOrder);
    const [warehouses, setWarehouses] = useState([]);

    async function fetchWH() {
        const res = await WarehouseRAPI.all(marketPlace);
        if (!res.error) {
            setWarehouses(res.items.filter(wh => wh.visible));
        }
    }

    async function fetchOrder() {
        const res = await FullFillRAPI.get(id, marketPlace);
        if (!res.error) {
            let byObs = res.items.reduce((acc, item) => {
                const sid = item.obsItem.observable.id;
                if (!(sid in acc)) {
                    acc[sid] = { items: [] };
                }

                const byStockName = item.obsItem.product.stock.reduce(
                    (acc, stock) => ({
                        ...acc,
                        [stock.warehouse_name]: {
                            whName: stock.warehouse_name,
                            need: stock.needed,
                            qty: stock.warehouse_name in item.stock ? item.stock[stock.warehouse_name].qty : 0,
                        },
                    }),
                    {},
                );

                acc[sid].items.push({ ...item, byStockName });
                return acc;
            }, {});

            byObs = Object.values(byObs).map(el => {
                el.needed = getObsSum(el.items);
                el.inOurStock = el.items[0].obsItem.observable.inOurStock;
                el.avail = el.inOurStock - el.needed;

                el.items = el.items.sort((a, b) => a.obsItem.packing - b.obsItem.packing);

                return el;
            });

            setOrder(recalcOrderTotal({ id: res.id, createdAt: res.createdAt, approved: res.approved, byObs }));
            setOrderIsEdited(false);
        }
    }

    async function saveOrder() {
        const items = order.byObs
            .map(el => {
                return el.items.map(item => {
                    return {
                        obsItemId: item.obsItem.id,
                        stock: item.byStockName,
                    };
                });
            })
            .reduce((acc, arr) => acc.concat(arr), []);

        if (id === 'new') {
            const res = await FullFillRAPI.create({
                mp: marketPlace,
                liters: order.liters,
                boxes: order.boxes,
                pallets: order.pallets,
                items,
            });
            if (!res.error) navigate('/fullfill/' + res.id);
        } else {
            const res = await FullFillRAPI.save(id, {
                liters: order.liters,
                boxes: order.boxes,
                pallets: order.pallets,
                items,
            });
            if (!res.error) {
                toast.success('Данные успешно сохранены');
                setOrderIsEdited(false);
            }
        }
    }

    useEffect(() => {
        if (queryParams.getAll('ids').length > 0) {
            // getObs(queryParams.getAll('ids'))
        }
        fetchOrder();
        fetchWH();
    }, [id]);

    async function downloadAllOrder() {
        setViewName(true);
        await sleep(200);
        await tableToXLSX(`fullfill_${order.id}`, document.querySelector(`table`), warehouses.filter(el => el.visible).length);
        await sleep(200);
        setViewName(false);
    }

    const [viewName, setViewName] = useState(false);

    function getObsSum(items) {
        return items.reduce((sum, item) => sum + item.qty * item.obsItem.packing, 0);
    }

    function getAvailColorClass(sum) {
        if (sum === 0) {
            return 'text-success';
        } else if (sum > 0) {
            return 'text-default';
        } else {
            return 'text-danger';
        }
    }

    function setStockQty(sindx, indx, whName, qty) {
        const item = order.byObs[sindx].items[indx];
        const whStock = item.byStockName[whName];
        whStock.qty = isNaN(parseInt(qty)) ? 0 : Math.max(parseInt(qty), 0);

        setOrder(recalcOrderTotal({ ...order }));
        setOrderIsEdited(true);
    }

    function recalcOrderTotal(orderCopy) {
        let totalVolume = 0;
        let whVolumes = {};
        orderCopy.byObs = orderCopy.byObs.map(el => {
            el.items = el.items
                .sort((a, b) => a.obsItem.packing - b.obsItem.packing)
                .map(item => {
                    item.qty = Object.values(item.byStockName).reduce((sum, whEl) => sum + whEl.qty, 0);
                    totalVolume += item.qty * item.obsItem.product.volume;

                    Object.keys(item.byStockName).forEach(key => {
                        if (!(key in whVolumes)) {
                            whVolumes[key] = { liters: 0 };
                        }
                        whVolumes[key].liters += item.byStockName[key].qty * item.obsItem.product.volume;
                    });
                    return item;
                });

            el.needed = getObsSum(el.items);
            el.inOurStock = el.items[0].obsItem.observable.inOurStock;
            el.avail = el.inOurStock - el.needed;
            el.items = el.items.sort((a, b) => a.obsItem.packing - b.obsItem.packing);

            return el;
        });

        for (let el in whVolumes) {
            whVolumes[el]['boxes'] = whVolumes[el].liters / 96;
            whVolumes[el]['pallets'] = whVolumes[el].liters / 96 / 16;
        }

        orderCopy.whVolumes = whVolumes;

        orderCopy.liters = totalVolume;
        orderCopy.boxes = totalVolume / 96;
        orderCopy.pallets = totalVolume / 96 / 16;

        return orderCopy;
    }

    function autoDistribute() {
        const orderCopy = { ...order };

        orderCopy.byObs.map(el => {
            let avail = el.inOurStock;

            warehouses.forEach(wh => {
                el.items = el.items
                    .sort((a, b) => b.obsItem.packing - a.obsItem.packing)
                    .map(item => {
                        if (wh.name in item.byStockName && item.byStockName[wh.name].need > 0 && avail > item.obsItem.packing) {
                            let diffQty = avail > item.byStockName[wh.name].need * item.obsItem.packing ? item.byStockName[wh.name].need : Math.floor(avail / item.obsItem.packing);
                            diffQty = Math.ceil(diffQty / 5) * 5;

                            const diff = diffQty * item.obsItem.packing;
                            if (diff <= avail) {
                                item.byStockName[wh.name].qty = diffQty;
                                avail = avail - diff;
                            }
                        } else if (wh.name in item.byStockName) {
                            item.byStockName[wh.name].qty = 0;
                        }

                        return { ...item, qty: Object.values(item.byStockName).reduce((sum, whEl) => sum + whEl.qty, 0) };
                    });
            });
            return el;
        });

        setOrder(recalcOrderTotal({ ...orderCopy }));
        setOrderIsEdited(true);
    }

    const getRGBC = perc => {
        const color = Math.round(255 - 255 * perc);
        return `rgb(${103 + color}, 116, 142)`;
    };

    async function setApproved() {
        const res = await FullFillRAPI.setApproved(order.id);

        if (!res.error) {
            toast.success('Остатки успешно списаны');
            setOrder({ ...order, approved: true });
        }
    }

    return (
        <div>
            <h3>{order.id ? `Задание ФФ #${order.id} от ${moment(order.createdAt).format('LL LT')}` : 'Новое задание ФФ'}</h3>
            <div className="row mt-4">
                <div className="col-md-12">
                    <div className="card mt-4" style={{ overflow: 'auto', height: 'calc(100vh - 300px)' }}>
                        <table className="table minipadding text-center align-middle th-sticky" style={{ position: 'relative' }}>
                            <thead>
                                <tr>
                                    {viewName && <th data-del-wh="true">Наименование</th>}
                                    {viewName && <th data-del-wh="true">Упаковка</th>}
                                    <th>Артикул</th>
                                    {viewName && <th>SKU</th>}
                                    {viewName && <th>Штрихкод</th>}
                                    {viewName && <th>Фасовка</th>}
                                    {viewName && <th>Литраж</th>}
                                    {warehouses.map(wh => (
                                        <th key={wh.name} data-wh={wh.name}>
                                            {wh.shortName}
                                        </th>
                                    ))}
                                    <th data-del-wh="true" className="text-wrap">
                                        Всего упак.
                                    </th>
                                    <th data-del-wh="true" className="text-wrap">
                                        Кол-во товара
                                    </th>
                                    <th data-del-wh="true" className="text-wrap">
                                        К отгр.
                                    </th>
                                    <th data-del="true" className="text-wrap">
                                        В налич.
                                    </th>
                                    <th data-del-wh="true" className="text-wrap">
                                        Ост. после
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.byObs &&
                                    order.byObs.map((el, sindx) => (
                                        <>
                                            {el.items.map((item, indx) => (
                                                <tr key={item.id}>
                                                    {viewName && (
                                                        <>
                                                            {indx === 0 ? (
                                                                <td data-del-wh="true" className="text-wrap" rowSpan={el.items.length}>
                                                                    {item.obsItem.observable.name}
                                                                </td>
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </>
                                                    )}
                                                    {viewName && <td data-del-wh="true">{item.obsItem.packingType}</td>}
                                                    <td className="td-sticky-left">
                                                        {useProductIcon(item.obsItem.product.mp, 1)}
                                                        {item.obsItem.product.offer_id}
                                                    </td>
                                                    {viewName && (
                                                        <td>
                                                            {item.obsItem.barcodePath
                                                                ? '{"t": "s", "v": "' +
                                                                  item.obsItem.product.sku +
                                                                  '", "l": {"Target": "https://mpsales.endlessmind.space/api/observable/label/' +
                                                                  item.obsItemId +
                                                                  '"}}'
                                                                : item.obsItem.product.sku}
                                                        </td>
                                                    )}
                                                    {viewName && <td>{item.obsItem.product.barcode}</td>}
                                                    {viewName && <td>{item.obsItem.packing}</td>}
                                                    {viewName && <td>{item.obsItem.product.volume}</td>}
                                                    {warehouses.map(wh => (
                                                        <>
                                                            {wh.name in item.byStockName ? (
                                                                <td data-wh={wh.name} style={{ color: getRGBC(item.byStockName[wh.name].qty / item.byStockName[wh.name].need) }}>
                                                                    <span style={{ display: 'none' }}>
                                                                        {item.byStockName[wh.name].qty > 0 ? item.byStockName[wh.name].qty : ''}
                                                                    </span>
                                                                    <span data-del="true">
                                                                        <input
                                                                            type="text"
                                                                            className="incell"
                                                                            value={item.byStockName[wh.name].qty}
                                                                            onChange={e => setStockQty(sindx, indx, wh.name, e.target.value)}
                                                                        />
                                                                        <span style={{ color: '#AAA' }}>/</span>
                                                                        {item.byStockName[wh.name].need}
                                                                    </span>
                                                                </td>
                                                            ) : (
                                                                <td data-wh={wh.name} style={{ background: '#CCC' }}>
                                                                    <span data-del="true">
                                                                        <input
                                                                            style={{ background: '#CCC' }}
                                                                            type="text"
                                                                            className="incell"
                                                                            value={0}
                                                                            onChange={e => setStockQty(sindx, indx, wh.name, e.target.value)}
                                                                        />
                                                                        <span style={{ color: '#AAA' }}>/</span>
                                                                        {0}
                                                                    </span>
                                                                </td>
                                                            )}
                                                        </>
                                                    ))}
                                                    <td data-del-wh="true">{item.qty}</td>
                                                    <td data-del-wh="true">{item.qty * item.obsItem.packing}</td>
                                                    {indx === 0 ? (
                                                        <td data-del-wh="true" rowSpan={el.items.length}>
                                                            {el.needed}
                                                        </td>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    {indx === 0 ? (
                                                        <td data-del="true" rowSpan={el.items.length}>
                                                            {el.inOurStock}
                                                        </td>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    {indx === 0 ? (
                                                        <td data-del-wh="true" className={getAvailColorClass(el.avail)} rowSpan={el.items.length}>
                                                            {el.avail}
                                                        </td>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                {order.liters > 0 && (
                                    <>
                                        <tr data-del-wh="true">
                                            <td className="text-end td-sticky-left" colSpan={viewName ? 7 : 1}>
                                                Итого литров:
                                            </td>
                                            {warehouses.map(wh => (
                                                <>
                                                    {wh.name in order.whVolumes ? <td>{Intl.NumberFormat('en').format(order.whVolumes[wh.name].liters.toFixed(2))}</td> : <td></td>}
                                                </>
                                            ))}
                                            <td>{Intl.NumberFormat('en').format(order.liters.toFixed(2))}</td>
                                        </tr>
                                        <tr data-del-wh="true">
                                            <td className="text-end td-sticky-left" colSpan={viewName ? 7 : 1}>
                                                Итого коробок:
                                            </td>
                                            {warehouses.map(wh => (
                                                <>{wh.name in order.whVolumes ? <td>{Intl.NumberFormat('en').format(order.whVolumes[wh.name].boxes.toFixed(2))}</td> : <td></td>}</>
                                            ))}
                                            <td>{Intl.NumberFormat('en').format(order.boxes.toFixed(2))}</td>
                                        </tr>
                                        <tr data-del-wh="true">
                                            <td className="text-end td-sticky-left" colSpan={viewName ? 7 : 1}>
                                                Итого паллет:
                                            </td>
                                            {warehouses.map(wh => (
                                                <>
                                                    {wh.name in order.whVolumes ? (
                                                        <td>{Intl.NumberFormat('en').format(order.whVolumes[wh.name].pallets.toFixed(2))}</td>
                                                    ) : (
                                                        <td></td>
                                                    )}
                                                </>
                                            ))}
                                            <td>{Intl.NumberFormat('en').format(order.pallets.toFixed(2))}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button className="btn btn-icon bg-gradient-success mt-4 float-end ms-3" onClick={saveOrder}>
                        Сохранить
                    </button>

                    <button className="btn btn-icon bg-gradient-primary mt-4 float-end ms-3" onClick={autoDistribute}>
                        Распределить
                    </button>
                    {!OrderIsEdited && !order.approved && id !== 'new' && (
                        <button className="btn btn-icon bg-gradient-primary mt-4 float-end ms-3" onClick={setApproved}>
                            Применить к остаткам
                        </button>
                    )}
                    <button className="btn btn-icon bg-gradient-primary mt-4 float-end ms-3" onClick={downloadAllOrder}>
                        Скачать ФФ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderFullFillDetail;

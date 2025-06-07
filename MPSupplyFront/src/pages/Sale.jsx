import React, {useEffect, useState} from 'react';
import WarehouseRAPI from "../API/WarehouseRAPI";
import {useTitle} from "../hooks/useTitle";
import OrderRAPI from "../API/OrderRAPI";
import {useNavigate} from "react-router-dom";

const Sale = () => {

    const navigate = useNavigate();
    useTitle('Магазин')
    const [Search, SetSearch] = useState('')
    const [Items, SetItems] = useState([])
    const [SelectItems, SetSelectItems] = useState([])

    async function getItems() {
        const res = await WarehouseRAPI.GetItems(4)

        if (!res.error) {
            SetItems(res)
        }
    }

    function addItem(item) {
        SetSearch('')
        item.sqty = 1
        SetSelectItems([...SelectItems, item])
    }

    function changeQTY(k, value) {
        let items = [...SelectItems]
        items[k].sqty = value
        SetSelectItems(items)
    }
    function changePrice(k, value) {
        let items = [...SelectItems]
        items[k].price = value
        SetSelectItems(items)
    }

    async function send() {
        const res = await OrderRAPI.addSale(SelectItems.map(el => {
            return {...el, count: el.sqty, price: +el.price, code: el.barcode, label: el.name}
        }))
        if (!res.error) navigate('/orders/' + res)
    }

    useEffect(function () {
        getItems()
    }, [])

    return (
        <div>
            <input type="text" className="form-control mb-4" placeholder="Поиск" value={Search} onChange={(e) => SetSearch(e.target.value)}/>
            <div className="items items_wrapper" style={{display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '390px', overflow: 'scroll'}}>
                {Items.filter(f => f.name.toLowerCase().includes(Search) || f.sku.toLowerCase().includes(Search) || f.barcode.includes(Search)).map(el =>
                    <div onClick={(() => addItem(el))} className="badge bg-gradient-primary p-3" style={{fontSize: '14px', whiteSpace: "initial", position: 'relative'}}>
                        {el.name}<br/>{el.barcode}
                        <div className="badge bg-gradient-warning" style={{position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '14px'}}>
                            {Intl.NumberFormat("ru").format(el.price)}
                        </div>
                        <div className="badge bg-gradient-secondary" style={{position: 'absolute', bottom: '-4px', left: '0px', fontSize: '14px'}}>
                            {Intl.NumberFormat("ru").format(el.qty)}
                        </div>
                    </div>
                )}
            </div>
            <h5>Товары</h5>
            {SelectItems.map((el, k) =>
                <div className="input-group mb-3">
                    <input type="text" className="form-control" style={{width: '70%'}} value={el.name}/>
                    <input type="text" className="form-control text-center" value={el.sqty} onChange={(e) => changeQTY(k, e.target.value)} style={{borderLeft: '1px solid #d2d6da', borderRight: '1px solid #d2d6da', marginRight: '1px' }}/>
                    <input type="number" className="form-control text-center" value={parseInt(el.price)} onChange={(e) => changePrice(k, e.target.value)}/>
                </div>
            )}
            <button className="btn bg-gradient-success" onClick={send}>Оплатить</button>
        </div>
    );
};

export default Sale;
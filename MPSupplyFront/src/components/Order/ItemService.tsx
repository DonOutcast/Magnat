import React, {useEffect, useState} from 'react';
import {MastersType, OrderItemServiceType, OrderItemType} from "../../models/OrderModels";
import {toast} from "react-toastify";
import ServiceRAPI from "../../API/ServiceRAPI";
import Modal from "../UI/Modal";

const ItemService = (props: {
    item: OrderItemServiceType,
    activeMasters: MastersType[],
    itemInfo: OrderItemType,
    needWarehouse: () => void,
    reloadLog: () => void
    reCalcSum: () => void
}) => {
    const [DDExpanded, setDDExpanded] = useState(false)

    const [status, setStatus] = useState(props.item.status)

    const [oldPrice, setOldPrice] = useState(Math.ceil(props.item.price))
    const [price, setPrice] = useState(Math.ceil(props.item.price))
    const [label, setLabel] = useState(props.item.label)
    const [oldLabel, setOldLabel] = useState(props.item.label)
    const [master, setMaster] = useState(props.item.masterId)
    const [materials, setMaterials] = useState(props.item.materials)
    const [suppliers, setSuppliers] = useState(props.item.suppliers)

    async function changePrice() {
        if (oldPrice !== price) {
            const res = await ServiceRAPI.setPrice(props.item.id, price)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Цена изменена')
                setOldPrice(price)

                props.reloadLog()
            }
        }
    }

    async function changeLabel() {
        if (oldLabel !== label) {
            const res = await ServiceRAPI.setLabel(props.item.id, label)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Название изменено')
                setOldLabel(label)

                props.reloadLog()
            }
        }
    }

    async function changeMaster(newMaster: number) {
        if (newMaster !== master) {
            const res = await ServiceRAPI.setMaster(props.item.id, newMaster)
            if (!res.error) {
                toast.success('Исполнитель изменен')
                setMaster(newMaster)

                props.reloadLog()
            }
        }
    }

    async function applyService() {
        const res = await ServiceRAPI.accept(props.item.id)
        if (!res.error) {
            toast.success('Услуга принята')
            setStatus(1)

            if (res && typeof res.status !== 'undefined' && res.status === 1) {
                props.needWarehouse()
            }

            props.reloadLog()
        }
    }

    const [rejCom, setRejCom] = useState('')
    const [modalRejectService, setModalRejectService] = useState(false)

    async function rejectService() {
        const res = await ServiceRAPI.reject(props.item.id, rejCom)
        if (res.error) {
            toast.error(res.error)
        } else {
            setModalRejectService(false)
            setRejCom('')
            setStatus(2)
            toast.success('В услуге отказано')

            props.reloadLog()
        }
    }

    const [matCom, setMatCom] = useState('')
    const [matPrice, setMatPrice] = useState('')
    const [modalAddMat, setModalAddMat] = useState(false)

    async function recalcWODiscount() {
        const res = await ServiceRAPI.recalcWODiscount(props.item.id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Цена пересчитана')
            setPrice(res)
            setOldPrice(res)

            props.reloadLog()
        }
    }

    async function addMaterial() {
        const res = await ServiceRAPI.addMaterial(props.item.id, matCom, Number(matPrice))
        if (!res.error) {
            setMaterials([...materials, {
                material: matCom,
                price: matPrice
            }])
            setMatCom('')
            setMatPrice('')
            setModalAddMat(false)
            toast.success('Материал добавлен')

            props.reloadLog()
        }
    }

    function statusBG() {
        switch (status) {
            case 0: return 'badge-warning'
            case 1: return 'badge-success'
            case 2: return 'badge-danger'
            default: return 'badge-info'
        }
    }

    const [suppList, setSuppList] = useState<any[]>([])
    const [selSuppList, setSelSuppList] = useState<any[]>([])

    const [modalAddSupply, setModalAddSupply] = useState(
        // TODO: HARDCODE
        (typeof props.item.addNow !== 'undefined' && ['s31', 's32', 's33', 's143', 's144'].includes(props.item.code) ? true : false)
    )

    async function fetch() {
        // TODO: Включить для привязки расходников
        // const res = await ServiceRAPI.AllSuppliers()
        // setSuppList(res)
    }

    useEffect(function () {
        fetch()
    }, [])

    function addSupply(el: any) {
        let val = 10.0

        if (props.itemInfo.sex == 'Мужской') {
            switch (props.item.code) {
                case 's28':
                case 's29':
                    val = 3.0;
                    break;
                case 's31':
                case 's32':
                case 's143':
                case 's144':
                    val = 4.0;
                    break;
                case 's33':
                    val = 7.0;
                    break;
            }
        } else {
            switch (props.item.code) {
                case 's28':
                case 's29':
                    val = 2.0;
                    break;
                case 's31':
                case 's32':
                case 's143':
                case 's144':
                    val = 3.0;
                    break;
                case 's33':
                    val = 5.0;
                    break;
            }
        }
        switch (props.item.code) {
            case 's27':
            case 's38':
                val = 2.0
                break
            case 's142':
                val = 1.0
                break
        }

        setSelSuppList([...selSuppList, {
            name: el.name,
            barcode: el.barcode,
            qty: val,
            itemId: el.id,
        }])
    }

    async function sendSupply() {

        const res = await ServiceRAPI.AddSuppliers(props.item.id, selSuppList)
        setModalAddSupply(false)
        setSuppliers(res)
        setSelSuppList([])
    }

    const [suppSearch, setSuppSearch] = useState('')

    return (
        <div>
            <div className="input-group mb-2">
                <input type="text" className={'form-control text-dark ' + statusBG()} onBlur={changeLabel} value={label} onChange={(e) => setLabel(e.target.value)} style={{borderTopRightRadius: "0px !important"}}/>
                <input type="number" className={'mxw60 ps-2 form-control text-dark ' + statusBG()} onBlur={changePrice} value={price} onChange={(e) => setPrice(parseInt(e.target.value))}/>
                {props.item.group != 'shop' &&
                <select className={'mxw180 text-center form-control text-dark ' + statusBG()} value={master}
                        onChange={(e) => changeMaster(parseInt(e.target.value))}>
                    <option value="0">Не указан</option>
                    {props.activeMasters.map((x) =>
                        <option key={x.id} value={x.id}>{x.fio}</option>
                    )}
                </select>
                }
                {props.item.group != 'shop' && status === 0 &&
                    <button className="btn bg-gradient-success mb-0 px-3 py-0" type="button" onClick={applyService}><i className="fa fa-check text-lg"/></button>
                }
                {props.item.group != 'shop' &&
                    <div className="dropdown dd1" onMouseEnter={() => setDDExpanded(true)} onMouseLeave={() => setDDExpanded(false)}>
                        <button className={'btn bg-gradient-info dropdown-toggle px-3 py-0 pe-4 ' + (DDExpanded?'show':'')} type="button" id="dropdownMenuButton"
                                data-bs-toggle="dropdown" aria-expanded="false"
                                style={{height: "100%", borderTopLeftRadius: "0", borderBottomLeftRadius: "0"}}>
                            <i className="fa fa-gear text-lg"/>
                        </button>
                        <ul className={'dropdown-menu shadow ' + (DDExpanded?'show':'')} aria-labelledby="dropdownMenuButton">
                            <li><button className="dropdown-item" onClick={() => setModalRejectService(true)}>Отказ</button></li>
                            <li><button className="dropdown-item" onClick={recalcWODiscount}>Пересчитать без скидки</button></li>
                            <li><button className="dropdown-item" onClick={() => setModalAddMat(true)}>Вычесть материал</button></li>
                            <li><button className="dropdown-item" onClick={() => setModalAddSupply(true)}>Добавить расходник</button></li>
                        </ul>
                    </div>
                }
            </div>
            {materials && materials.map((elem) =>
                <p className="text-xs">Материал: {elem.material} <b>{elem.price}р</b></p>
            )}
            {suppliers && suppliers.map((elem) =>
                <p className="text-xs">Расходник: {elem.cache_name} <b>{Intl.NumberFormat("ru").format(elem.qty)}</b></p>
            )}

            <Modal id="appPayment" title="Отказ от услуги" onClose={() => setModalRejectService(false)} show={modalRejectService} footerButtons={<button className="btn bg-gradient-success" onClick={rejectService}>Продолжить</button>}>
                <div className="form-group">
                    <label>Причина отказа</label>
                    <input type="text" value={rejCom} onChange={(e) => setRejCom(e.target.value)} className="form-control"/>
                </div>
            </Modal>
            <Modal id="appMaterial" title="Добавить материал" onClose={() => setModalAddMat(false)} show={modalAddMat} footerButtons={<button className="btn bg-gradient-success" onClick={addMaterial}>Сохранить</button>}>
                <div className="form-group">
                    <label>Название материала</label>
                    <input type="text" value={matCom} onChange={(e) => setMatCom(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group">
                    <label>Стоимость материала</label>
                    <input type="number" value={matPrice} onChange={(e) => setMatPrice(e.target.value)} className="form-control"/>
                </div>
            </Modal>
            <Modal id="appSupply" addClass="modal-lg" title="Добавить расходник" onClose={() => setModalAddSupply(false)} show={modalAddSupply} footerButtons={<button className="btn bg-gradient-success" onClick={sendSupply}>Сохранить</button>}>
                <div className="form-group">
                    <input type="text" value={suppSearch} placeholder="Поиск..." onChange={(e) => setSuppSearch(e.target.value)} className="form-control"/>
                </div>
                <div className="row service_list" style={{height: '325px', overflowY: 'scroll'}}>
                    {suppList.filter((f) => f.name.toLowerCase().includes(suppSearch) || f.sku.toLowerCase().includes(suppSearch) || f.barcode.includes(suppSearch)).map((el) =>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card serviceCard h-100" style={{backgroundImage: 'linear-gradient(310deg,#2b2a29,#666)', color: '#ccc'}}
                            onClick={() => addSupply(el)}>
                                <div className="card-body p-3">
                                    <h6 style={{color: '#fff'}}>{el.name} <br/>{el.barcode} {el.sku}</h6>
                                    <div className="text-sm priceBadge">{Intl.NumberFormat("ru").format(el.stock)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <h5 className="mt-4">Расходники</h5>
                {selSuppList.map((el, k) =>
                <div className="input-group mb-3">
                    <input type="text" className="form-control" value={el.name} style={{width: '70%'}}/>
                    <input type="text" className="form-control text-center" value={el.qty}
                    style={{borderLeft: '1px solid rgb(210, 214, 218)', marginRight: '1px'}}/>
                </div>
                )}
            </Modal>
        </div>
    );
};

export default ItemService;
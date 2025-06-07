import React, {useEffect, useState} from 'react';
import {MastersType, OrderItemType} from "../../models/OrderModels";
import ItemService from "./ItemService";
import {toast} from "react-toastify";
import Modal from "../UI/Modal";
import ItemRAPI from "../../API/ItemRAPI";
import ServiceRAPI from "../../API/ServiceRAPI";
import {get} from "lodash"

const ItemCard = (props) => {

    const [DDExpanded, setDDExpanded] = useState(false)
    function sexIcon() {
        switch (props.item.sex) {
            case "Мужской": return <i className="fa fa-male text-lg"/>
            case "Женский": return <i className="fa fa-female text-lg"/>
            case "Детский": return <i className="fa fa-baby text-lg"/>
            default: return props.item.sex
        }
    }

    function groupIcon() {
        switch (props.item.group) {
            case "Обувь": return <i className="fa fa-shoe-prints text-lg"/>
            case "Аксессуары": return <i className="fa fa-shopping-bag text-lg"/>
            case "Куртка": return <i className="fa fa-tshirt text-lg"/>
            default: return props.item.group
        }
    }

    const [WH, setWH] = useState(props.item.warehouse)

    const [modalWarehouse, setModalWarehouse] = useState(false)
    const [WHRack, setWHRack] = useState('A')
    const [WHShelf, setWHShelf] = useState('1')

    const [modalIssue, setModalIssue] = useState(false)
    const [IssueCode, setIssueCode] = useState('')

    async function issueItem() {
        const res = await ItemRAPI.setIssue(props.item.id, IssueCode)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Изделие выдано')
            setWH('Выдан')
            setIssueCode('')
            setModalIssue(false)
            props.reloadLog()
        }
    }
    async function issueFreeze() {
        const res = await ItemRAPI.setFreeze(props.item.id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Изделие заморожено')
            props.reloadLog()
        }
    }

    async function ItemWarehouse() {
        const res = await ItemRAPI.setWarehouse(props.item.id, WHRack, WHShelf)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Изделие перемещено')
            setWH(WHRack+WHShelf)
            setWHRack('A')
            setWHShelf('1')
            setModalWarehouse(false)
            props.reloadLog()
        }
    }

    const [DesireModal, SetDesireModal] = useState(false)
    const [DesireDate, SetDesireDate] = useState(props.item.desired_at)
    const [DesireComment, SetDesireComment] = useState('')

    async function ItemDesire() {
        const res = await ItemRAPI.setDesire(props.item.id, DesireDate, DesireComment)
        if (res.error) {
            toast.error(res.error)
        } else {
            SetDesireModal(false)
            SetDesireComment('')
            toast.success('Срок перенесен')
            props.reloadLog()
        }
    }

    async function returnWarranty() {
        const res = await ItemRAPI.returnWarranty(props.item.id)

        const services = ItemServices.map((el) => {
            el.status = 0
            return el
        })

        setWH(null)
        setItemServices([])
        setTimeout(function () {
            setItemServices(services)
        }, 250)
        props.reloadLog()
        toast.success('Изделие возвращено по гарантии')
    }

    async function printLabel() {
        const res = await ItemRAPI.getTicket(props.item.id)

        let socket = new WebSocket("ws://127.0.0.1:8765");

        setTimeout(function () {
            toast.success('Данные отправлены на печать')
            socket.send(res);
        }, 500);
    }

    const [ItemServices, setItemServices] = useState(props.item.services)

    const [AllServices, setAllServices] = useState([])
    const [path, setPath] = useState([])
    const [SGROUP, setSGROUP] = useState(null)
    
    async function getAllServices() {
        let itemGroup = 1
        if (props.item.group === 'Аксессуары') {
            itemGroup = 2
        } else if (props.item.group === 'Куртка') {
            itemGroup = 3
        }
        const res = await ServiceRAPI.AllServicesByGroup(itemGroup)
        setAllServices(res)
    }

    function getCurServiceState() {
        if (path.length === 0) {
            if (AllServices.length > 0) {
                return AllServices
            }
            return []
        }
        return get(AllServices, path)
    }

    async function addServiceByPath(myPath) {
        const serv = get(AllServices, myPath)
        let newService = {
            itemId: props.item.id,
            orderId: +props.item.orderId,
            code: 's' + serv.id,
            group: 's' + SGROUP,
            label: serv.name,
            price: serv.price,
            desiredAt: props.item.desiredAt,
            materials: [],
            suppliers: [],
            status: 0
        }

        newService = await ServiceRAPI.addService(newService)
        newService.addNow = true
        setItemServices([...ItemServices, {...newService, materials: [], suppliers: []}])

        setModalAddService(false)
        setPath([])
        props.reloadLog()
    }

    const [ServiceSearch, setServiceSearch] = useState('')

    const [modalAddService, setModalAddService] = useState(false)

    useEffect(function() {
        getAllServices()
    },[])

    if (props.item.warehouse === 'Выдан' && WH !== 'Выдан') {
        setWH(props.item.warehouse)
    }

    const [oldComment, setOldComment] = useState(props.item.comment)
    const [comment, setComment] = useState(props.item.comment)

    async function setCommentF()
    {
        if (oldComment !== comment) {
            await ItemRAPI.setComment(props.item.id, comment)
            toast.success('Комментарий успешно изменен')
            setOldComment(comment)
            props.reloadLog()
        }
    }

    return (
        <div className="card mb-4" onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between mb-2 item-title-wrapper">
                    {WH !== null &&
                        <span className={'item-warehouse-position bg-gradient-' + (WH === 'Выдан'?'success':'info')}>{WH}</span>
                    }
                    {props.item.type !== 'Магазин' ?
                        <h6 className="item-title">
                            {props.item.id} {groupIcon()}&nbsp;
                            {props.item.type}
                            <span className="text-sm text-secondary"> Мат.:</span> {props.item.material}
                            <span className="text-sm text-secondary"> Цвет:</span> {props.item.color}
                            <span className="text-sm text-secondary"> Пол:</span> {sexIcon()}
                            <span className="text-sm text-secondary"> Износ:</span> {props.item.wear}
                        </h6>
                        :
                        <h6 className="item-title">
                            {groupIcon()}&nbsp;
                            {props.item.type}
                        </h6>
                    }
                    <div className="input-group w-auto item-add-btngp ms-auto">
                        <button className="btn bg-gradient-primary mb-0 px-3 py-0" type="button" onClick={() => setModalAddService(true)}><i className="fa fa-plus"/> Услуга</button>
                        <div className="dropdown dd2" onMouseEnter={() => setDDExpanded(true)} onMouseLeave={() => setDDExpanded(false)}>
                            <button className={'btn bg-gradient-info dropdown-toggle px-3 py-0 pe-4 ' + (DDExpanded?'show':'')} type="button" id="dropdownMenuButton"
                                    data-bs-toggle="dropdown" aria-expanded="false"
                                    style={{height: "100%", borderTopLeftRadius: "0", borderBottomLeftRadius: "0"}}>
                                <i className="fa fa-gear text-lg"/>
                            </button>
                            <ul className={'dropdown-menu ' + (DDExpanded?'show':'')} aria-labelledby="dropdownMenuButton">
                                <li><button className="dropdown-item" onClick={() => setModalIssue(true)}>Выдать клиенту</button></li>
                                <li><button className="dropdown-item" onClick={() => setModalWarehouse(true)}>Поместить в стеллаж</button></li>
                                <li><button className="dropdown-item" onClick={() => SetDesireModal(true)}>Перенести срок</button></li>
                                <li><button className="dropdown-item" onClick={issueFreeze}>Заморозить</button></li>
                                <li><button className="dropdown-item" onClick={returnWarranty}>Вернуть по гарантии</button></li>
                                <li><button className="dropdown-item" onClick={printLabel}>Распечатать этикетку</button></li>
                                {props.canDelete &&
                                <li>
                                    <button className="dropdown-item text-danger" onClick={props.onDelete}>Удалить изделие</button>
                                </li>
                                }
                            </ul>
                        </div>
                    </div>
                </div>
                {ItemServices.map((el, index) =>
                    <ItemService key={el.id} item={el} itemInfo={props.item} activeMasters={props.activeMasters} needWarehouse={() => setModalWarehouse(true)} reloadLog={() => props.reloadLog()}/>
                )}
                <textarea className="form-control" rows="1" onBlur={setCommentF} onChange={(e) => setComment(e.target.value)}>{comment}</textarea>
            </div>
            <Modal id="appPayment" title="Поместить на стеллаж" onClose={() => setModalWarehouse(false)} show={modalWarehouse} footerButtons={<button className="btn bg-gradient-success" onClick={ItemWarehouse}>Положить</button>}>
                <form>
                    <div className="form-group">
                        <label>Стеллаж</label>
                        <select className={'form-control text-dark'} value={WHRack} onChange={(e) => setWHRack(e.target.value)}>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                            <option value="H">H</option>
                            <option value="R">R (ресепшн)</option>
                            <option value="RB">RB (ресепшн B)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Полка</label>
                        <input type="number" value={WHShelf} onChange={(e) => setWHShelf(e.target.value)} className="form-control"/>
                    </div>
                </form>
            </Modal>
            <Modal id="issue" title="Выдать товар" onClose={() => setModalIssue(false)} show={modalIssue} footerButtons={<button className="btn bg-gradient-success" onClick={issueItem}>Выдать</button>}>
                <div className="form-group">
                    <label>Код выдачи</label>
                    <input type="text" value={IssueCode} onChange={(e) => setIssueCode(e.target.value)} className="form-control"/>
                </div>
            </Modal>
            <Modal id="desireItem" title="Перенос срока" onClose={() => SetDesireModal(false)} show={DesireModal} footerButtons={<button className="btn bg-gradient-success" onClick={ItemDesire}>Сохранить</button>}>
                <div className="form-group">
                    <label>Дата</label>
                    <input type="date" value={DesireDate} onChange={(e) => SetDesireDate(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group">
                    <label>Причина</label>
                    <input type="text" value={DesireComment} onChange={(e) => SetDesireComment(e.target.value)} className="form-control"/>
                </div>
            </Modal>
            <Modal id="addService" title="Добавить услугу" addClass="modal-lg" onClose={() => {
                setPath([])
                setModalAddService(false)
            }} show={modalAddService}>
                <div style={{minHeight: '50vh'}}>
                    <input type="text" className="form-control mb-3" placeholder="Поиск по названию" value={ServiceSearch} onChange={(e) => setServiceSearch(e.target.value)}/>
                    <div className="row service_list">
                        {getCurServiceState().map((el, k) =>
                            <div className="col-lg-3 col-md-4 mb-4" key={el.id} style={{display: (ServiceSearch !== '' && el.name.toLowerCase().indexOf(ServiceSearch.toLowerCase()) === -1?'none':'block')}}>
                                <div className="card serviceCard h-100" onClick={() => {
                                    setServiceSearch('')
                                    if (el.items.length === 0) {
                                        addServiceByPath([...path, k])
                                    } else {
                                        if (path.length === 0) {
                                            setSGROUP(el.id)
                                        }
                                        setPath([...path, k, 'items'])
                                    }
                                }} style={{backgroundImage: 'linear-gradient(310deg,#2b2a29,#666)', color: '#ccc'}}>
                                    <div className="card-body p-3">
                                        <h6 style={{color: '#fff'}}>{el.name}</h6>
                                        {!isNaN(parseInt(el.price)) && parseInt(el.price) > 0 &&
                                            <div className="text-sm priceBadge">{Intl.NumberFormat("ru").format(el.price)}</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ItemCard;
import React, {useEffect, useState} from 'react';
import ServiceRAPI from "../API/ServiceRAPI";
import {useNavigate} from "react-router-dom";
import Modal from "../components/UI/Modal";
import {useTypedSelector} from "../hooks/useTypedSelector";
import {toast} from "react-toastify";
import {useTitle} from "../hooks/useTitle";
import Moment from 'moment';

const WorksWoMaster = () => {
    useTitle('Назначение мастера')
    const navigate = useNavigate();

    const masters = useTypedSelector(state => state.masters)

    const [works, setWorks] = useState([])
    const [filter, setFilter] = useState('wo_clear')

    async function fetch()
    {
        const res = await ServiceRAPI.WorkWOMaster(filter, 1, 50)

        if (res.list) {
            setWorks(res.list)
        }
    }

    useEffect(function() {
        fetch()
    }, [filter])

    const [serviceData, setServiceData] = useState({})

    async function setMaster(id)
    {
        const res = await ServiceRAPI.setMaster(serviceData.id, +id)
        if (!res.error) {
            toast.success('Исполнитель изменен')
            setServiceData({})
            fetch()
        }
    }

    const [modal, setModal] = useState(false)

    useEffect(function () {
        if (serviceData.hasOwnProperty('orderId')) {
            setModal(true)
        } else {
            setModal(false)
        }
    }, [serviceData])

    function getOrderHtml(el) {
        return `<td style="cursor: pointer;"><b>${el.orderId}_${el.itemId}</b> ${el.item.type} <br/>${el.item.color}</td>`
    }

    function getClientHtml(el) {
        return `<td>${el.order.client.last_name} ${el.order.client.name} ${el.order.client.second_name} <br/>${el.order.client.phone}</td>`
    }

    return (
        <div className="row">
            <div className="col-md-12 mb-4">
                <div className="d-sm-flex justify-content-between">
                    <div className="d-flex">
                        <select className="form-control" style={{height: '41px'}} value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="wo_clear">Все кроме чистки</option>
                            <option value="all">Все типы работ</option>
                            <option value="fix">Ремонт</option>
                            <option value="cons">Консультация</option>
                            <option value="clear">Чистка</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="col-md-12">
                <div className="card">
                    <div className="table-responsive">
                        <table className="table align-items-center mb-0">
                            <thead>
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Заказ</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Клиент</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Работа</th>
                                </tr>
                            </thead>
                            <tbody>
                            {works.map(el =>
                               <tr key={el.id} onClick={() => setServiceData(el)}>
                                   <td style={{cursor: 'pointer'}} onClick={() => navigate('/orders/'+ el.orderId)} dangerouslySetInnerHTML={{__html: getOrderHtml(el)}}/>
                                    <td>{Moment(el.item.createdAt).format('L, LT')}</td>
                                   <td dangerouslySetInnerHTML={{__html: getClientHtml(el)}}/>
                                   <td>{el.label}</td>
                               </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Modal id="setMaster" title="Выбрать мастера" onClose={() => setModal(false)} show={modal}>
                <div className="form-group">
                    <label>Заказ</label>
                    <input type="text" disabled readOnly className="form-control" value={serviceData.orderId}/>
                </div>
                <div className="form-group">
                    <label>Работа</label>
                    <input type="text" disabled readOnly className="form-control" value={serviceData.label}/>
                </div>
                <div className="form-group">
                    <label>Мастер</label>
                    <select className="form-control" value={serviceData.label} onChange={(e) => setMaster(e.target.value)}>
                        <option value="">Выберите мастера</option>
                        {masters.masters.filter((el) => {
                            return el.active && el.role_id !== 1
                        }).map(el =>
                            <option value={el.id} key={el.id}>{el.fio}</option>
                        )}
                    </select>
                </div>
            </Modal>
        </div>
    );
};

export default WorksWoMaster;
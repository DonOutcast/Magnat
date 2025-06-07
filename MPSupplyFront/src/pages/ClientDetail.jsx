import React, {useEffect, useState} from 'react';
import ClientRAPI from "../API/ClientRAPI";
import {useNavigate, useParams} from "react-router-dom";
import ReactInputMask from "react-input-mask";
import InfoCard from "../components/UI/InfoCard";
import {toast} from "react-toastify";
import moment from 'moment';

const ClientDetail = () => {
    let {id} = useParams()
    const navigate = useNavigate();
    const [client, setClient] = useState({})

    async function fetch() {
        const res = await ClientRAPI.getById(id)

        if (!res.error) {
            setClient(res)
        }
    }

    async function saveClient() {
        const res = await ClientRAPI.setClient(client)

        if (!res.error) {
            setClient(res)
            toast.success('Данные успешно сохранены')
        }
    }

    function addRepres() {
        let r = {...client}
        r.represes.push({p: '', f: ''})
        setClient(r)
    }

    function removeRepres(k) {
        let r = {...client}
        r.represes.splice(k, 1);
        setClient(r)
    }

    function changeRepresPhone(k, value) {
        let r = {...client}
        r.represes[k].p = value
        setClient(r)
    }
    function changeRepresFIO(k, value) {
        let r = {...client}
        r.represes[k].f = value
        setClient(r)
    }

    useEffect(function() {
        fetch()
    }, [])

    function statusClass(statuses) {
        switch (statuses.join('')) {
            case '0':
            case '01':
            case '012':
            case '013':
            case '02':
            case '03':
            case '3':
            case '13':
            case '23':
                return 'bg-gradient-light'
            case '1':
            case '12':
            case '123':
                return 'bg-gradient-warning'
            case '2':
                return 'bg-gradient-success'
            case '24':
                return 'bg-gradient-info'
            default:
                return 'bg-gradient-danger'
        }
    }
    function statusName(statuses) {
        switch (statuses.join('')) {
            case '0':
            case '01':
            case '012':
            case '013':
            case '02':
            case '03':
            case '3':
            case '13':
            case '23':
                return 'В работе'
            case '1':
            case '12':
            case '123':
                return 'Ждет выдачи'
            case '2':
                return 'Закрыт'
            case '24':
                return 'Требует проверки'
            default:
                return 'Ошибка'
        }


    }

    return (
        <div>
            <h3><span className="text-secondary">Клиент:</span> {client.last_name} {client.name} {client.second_name} <span className="py-1 px-2 badge bg-gradient-warning text-sm">{client.type}</span></h3>
            <div className="row">
                <div className="col-md-8">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label>Телефон</label>
                                <ReactInputMask mask="+7 (999) 999-99-99" type="text" className="form-control"
                                                placeholder="Номер телефона" value={client.phone}
                                                onChange={(e) => setClient({...client, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Скидка</label>
                                <input type="number" value={client.discount} onChange={(e) => setClient({...client, discount: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Тип клиента</label>
                                <select value={client.type} onChange={(e) => setClient({...client, type: e.target.value})} className="form-control">
                                    <option value="">Рядовой</option>
                                    <option value="vip">VIP</option>
                                    <option value="bl">BL Черный список</option>
                                    <option value="alex klein">Alex Klein</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Комментарий</label>
                                <input type="text" value={client.comment} onChange={(e) => setClient({...client, comment: e.target.value})} className="form-control"/>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label>Фамилия</label>
                                <input type="text" value={client.last_name} onChange={(e) => setClient({...client, last_name: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Имя</label>
                                <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} className="form-control"/>
                            </div>
                            <div className="form-group">
                                <label>Отчество</label>
                                <input type="text" value={client.second_name} onChange={(e) => setClient({...client, second_name: e.target.value})} className="form-control"/>
                            </div>

                            <div className="form-group">
                                <label>Депозит</label>
                                <input type="text" value={client.deposit} onChange={(e) => setClient({...client, deposit: e.target.value})} className="form-control"/>
                            </div>
                        </div>
                        <div className="col-md-12">
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    {client.stat &&
                    <InfoCard title="Статистика" elements={[
                        {label: 'Количество заказов', value: Intl.NumberFormat("ru").format(client.stat.orders.cnt)},
                        {label: 'Количество изделий', value: Intl.NumberFormat("ru").format(client.stat.services.items)},
                        {label: 'Количество услуг', value: Intl.NumberFormat("ru").format(client.stat.services.services)},
                        {label: 'Общая сумма', value: Intl.NumberFormat("ru").format(parseInt(client.stat.orders.sum))},
                        {label: 'Средний чек', value: Intl.NumberFormat("ru").format(parseInt(client.stat.orders.avg))},
                    ]}/>
                    }
                </div>
            </div>
            <div className="row">
                <div className="col-md-4">
                    <h6>Представители</h6>
                    {client.represes && client.represes.map((el, k) =>
                    <div className="input-group mb-3">
                        <ReactInputMask mask="+7 (999) 999-99-99" type="text" className="form-control"
                            placeholder="Номер телефона" value={el.p}
                            onChange={(e) => changeRepresPhone(k, e.target.value)}
                        />
                        <input type="text" placeholder="ФИО" value={el.f} onChange={(e) => changeRepresFIO(k, e.target.value)} className="form-control"/>
                        <button className="btn bg-gradient-primary mb-0" onClick={() => removeRepres(k)}>X</button>
                    </div>
                    )}
                    <button className="btn bg-gradient-primary" onClick={addRepres}>+ Добавить</button>
                </div>
                <div className="col-md-4">
                    <h6>&nbsp;</h6>
                    <button className="btn bg-gradient-success" onClick={saveClient}>Сохранить</button>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-md-8">
                    <h6>Заказы</h6>
                    <div className="card" style={{overflowX: 'scroll'}}>
                        <table className="table text-center">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Дата</th>
                                    <th>Сумма</th>
                                    <th>Оплачено</th>
                                    <th>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {client.orders && client.orders.map(el =>
                                    <tr onClick={() => navigate('/orders/' + el.id)}>
                                        <td>{el.id}</td>
                                        <td>{moment(el.createdAt).format('L, LT')}</td>
                                        <td>{Intl.NumberFormat("ru").format(el.totalSum)}</td>
                                        <td className={el.totalSum !== el.payedSum?'text-danger':''}>{Intl.NumberFormat("ru").format(el.payedSum)}</td>
                                        <td><span className={"badge " + statusClass(el.statuses)}>{statusName(el.statuses)}</span></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="col-md-4">
                    <h6>Статистика по годам</h6>
                    <div className="card">
                        <table className="table text-center">
                            <thead>
                            <tr>
                                <th>№</th>
                                {client.chart && client.chart.years && client.chart.years.map(el =>
                                    <th>{el}</th>
                                )}
                            </tr>
                            </thead>
                            <tbody>
                            {client.chart && client.chart.data.map((el, k) =>
                                <tr>
                                    <td>{el.name}</td>
                                    {client.chart && client.chart.years && client.chart.years.map((year, key) =>
                                        <td>{Intl.NumberFormat("ru").format(el.data[key])}</td>
                                    )}
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetail;
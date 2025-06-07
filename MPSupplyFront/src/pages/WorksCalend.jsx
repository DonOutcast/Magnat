import React, {useEffect, useState} from 'react';
import {useTypedSelector} from "../hooks/useTypedSelector";
import ServiceRAPI from "../API/ServiceRAPI";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {useTitle} from "../hooks/useTitle";
import {useAccess} from "../hooks/useAccess";
import moment from 'moment';

const WorksCalend = () => {
    useTitle('Календарь задач')
    const navigate = useNavigate();

    function goToOrder(id) {
        navigate('/orders/' + id)
    }

    const allCalendar = useAccess('all_calendar')

    const user = useTypedSelector(state => state.itemRefs.user)

    const [Worker, SetWorker] = useState(allCalendar ? 'all': user.id)
    const [search, setSearch] = useState('')
    const [List, SetList] = useState([])
    const masters = useTypedSelector(state => state.masters)

    function filterMasters(masters) {
        return masters.filter((x) => {
            return x.role_id !== 1 && x.active
        })
    }

    const activeMasters = filterMasters(masters.masters)

    async function getList()
    {
        const res = await ServiceRAPI.WorkList(Worker)

        if (res.error) {
            SetList([])
        } else {
            SetList(Object.keys(res).sort().reduce(
                (obj, key) => { 
                  obj[key] = res[key]; 
                  return obj;
                }, 
                {}
              ))
        }
    }

    function renderList()
    {
        let arr = []
        let cnt = 0
        Object.keys(List).map(group => {
            let color = '#EEE'
            if (group.substr(4) === 'Заморожено') color = '#8CF'
            if (group.substr(4) === 'Просрочено') color = '#FAA'
            if (group.substr(4) === 'Сегодня') color = '#FC8'

            arr.push({type: 'title', i: cnt, color: color, title: group.substr(4)})
            cnt++
            let befcnt = cnt
            List[group].filter(el => el.orderId.toLowerCase().includes(search) || el.itemId.toLowerCase().includes(search) || el.item.order.client.last_name.toLowerCase().includes(search) || el.label.includes(search)).map(el => {
                arr.push({...el, type: 'elem', i: cnt})
                cnt++
            })
            if (befcnt === cnt) {
                arr.pop()
            }
        })

        return arr
    }

    useEffect(function () {
        getList()
    }, [Worker])

    useEffect(function () {
        renderList()
    }, [List])

    return (
        <div className="row">
            <div className="col-md-12">
                <div className="d-sm-flex justify-content-between">
                    <div className="d-flex">
                        <input type="text" className="form-control mb-3" placeholder="Поиск по заказам" style={{height: '41px'}} value={search} onChange={(e) => setSearch(e.target.value.toLowerCase())}/>
                    </div>
                </div>
            </div>
            <div className="col-md-12">
                <div className="card work-list-card">
                    {useAccess('all_calendar') &&
                    <div className="p-3" style={{display: 'flex', gap: '0 20px', flexWrap: 'wrap'}}>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="radio" id={'flexSwitchCheck_all'} name="bubu" value="all" checked={Worker === 'all'} onChange={(e) => SetWorker(e.currentTarget.value)}/>
                            <label className="form-check-label" htmlFor={'flexSwitchCheck_all'}>Все</label>
                        </div>
                        {activeMasters.map(v =>
                            <div className="form-check form-switch" key={v.id}>
                                <input className="form-check-input" type="radio" id={'flexSwitchCheck_' + v.id} name="bubu" value={v.id} onChange={(e) => SetWorker(e.currentTarget.value)}/>
                                <label className="form-check-label" htmlFor={'flexSwitchCheck_' + v.id}>{v.fio.replace(' ', '\u00A0')}</label>
                            </div>
                        )}
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="radio" id={'flexSwitchCheck_none'} name="bubu" value="none" onChange={(e) => SetWorker(e.currentTarget.value)}/>
                            <label className="form-check-label" htmlFor={'flexSwitchCheck_none'}>Без исполнителя</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="radio" id={'flexSwitchCheck_cons'} name="bubu" value="cons" onChange={(e) => SetWorker(e.currentTarget.value)}/>
                            <label className="form-check-label" htmlFor={'flexSwitchCheck_cons'}>Консультация</label>
                        </div>
                    </div>
                    }
                    <div className="table-responsive">
                        <table className="table align-items-center mb-0">
                            <thead>
                                {allCalendar &&
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Заказ</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Клиент</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Работа</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Исполнитель</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Цена</th>
                                </tr>
                                }
                            </thead>
                            <tbody>
                            {renderList().map(el =>
                                <tr key={el.i}>
                                    {el.type === 'title' &&
                                        <td className="text-center text-bold" colSpan="6" style={{backgroundColor: el.color}}>{el.title.includes('_') ? el.title.split('_')[1] : el.title}</td>
                                    }
                                    {el.type === 'elem' &&
                                        <>
                                            {allCalendar &&
                                            <>
                                                <td style={{cursor: 'pointer'}} onClick={() => goToOrder(el.orderId)}><b>{el.orderId}_{el.itemId}</b> {el.item.type}<br/>{el.item.color}</td>
                                                <td>{moment(el.item.order.createdAt).format('L, LT')}</td>
                                                <td>{el.item.order.client.last_name} {el.item.order.client.name} {el.item.order.client.second_name}<span className="badge bg-gradient-warning">{el.item.order.client.type}</span><br/><b>{el.item.order.comment}</b></td>
                                                <td className="text-wrap">{el.label}<br/><b>{el.item.comment}</b></td>
                                                <td>{el.master ? el.master.fio : <span className='text-danger'>Не указан</span>}</td>
                                                <td>{el.price} {el.item.order.discount !== 0 &&
                                                    <span className="text-sm">{el.item.order.discount}%</span>
                                                }</td>
                                            </>
                                            }
                                            {!allCalendar &&
                                            <>
                                                <td>
                                                    <b>{el.orderId}_{el.itemId}</b> {el.item.type} {el.item.color}
                                                    <br/><b>{el.label}</b>
                                                    {el.item.comment ? <br/> : ''}{el.item.comment}
                                                    <br/><b>{el.price} р. {el.item.order.discount !== 0 &&
                                                        <span className="text-sm">{el.item.order.discount}%</span>
                                                    }</b>
                                                </td>
                                            </>
                                            }
                                        </>
                                    }
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

export default WorksCalend;
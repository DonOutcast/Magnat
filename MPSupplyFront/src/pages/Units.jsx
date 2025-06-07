import React, {useEffect, useState} from 'react';
import UserRAPI from "../API/UserRAPI";
import TimeLineZP from "../components/UI/TimeLineZP";
import PaymentAdd from "../components/PaymentAdd";
import {useTitle} from "../hooks/useTitle";
import {useAccess} from "../hooks/useAccess";
import {useTypedSelector} from "../hooks/useTypedSelector";
import Modal from "../components/UI/Modal";
import {useNavigate} from "react-router-dom";
import moment from 'moment';

const Units = () => {
    useTitle('Сотрудники')
    const roles = [
        {id: 1, name: 'Администраторы'},
        {id: 2, name: 'Мастера'},
    ]

    const user = useTypedSelector(state => state.itemRefs.user)

    const [Year, SetYear] = useState(new Date().getFullYear())
    const [Month, SetMonth] = useState(new Date().getMonth() + 1)

    const hasAllZPAccess = useAccess('all_zp')

    const [Units, SetUnits] = useState([])
    const [Worker, SetWorker] = useState(hasAllZPAccess ? 0 : user.id)
    const [Stat, SetStat] = useState(null)
    const [Days, SetDays] = useState([])

    async function getList()
    {
        let res = {}
        
        if (hasAllZPAccess) {
            res = await UserRAPI.GetList()
        }

        if (!res.error) {
            SetUnits(res)
        }
    }

    function getDays() {
        let arr = []

        if (Stat && Stat.stat && Stat.stat.dayStat) {
            Object.keys(Stat.stat.dayStat).sort().forEach(key => {
                arr.push({...Stat.stat.dayStat[key], day: key})
            });
        }

        return arr
    }

    async function setInfo()
    {
        let res = {}

        if (hasAllZPAccess) {
            res = await UserRAPI.GetSalaryInfo(Worker, Year, Month)
        } else {
            res = await UserRAPI.GetSalaryInfoMy(Year, Month)
        }

        if (!res.error) {
            SetStat(res)
        } else {
            SetStat(null)
        }
    }

    useEffect(function () {
        getList()
    }, [])

    useEffect(function () {
        if (Worker != 0) {
            setInfo()
        }
    }, [Worker, Year, Month])

    useEffect(function () {
        SetDays(getDays())
    }, [Stat])

    const [modalPaymentAdd, setModalPaymentAdd] = useState(false)

    const [modalDetails, setModalDetails] = useState(false)
    const [details, setDetails] = useState([])

    const navigate = useNavigate();

    function updateDetails(week)
    {
        let list = []
        Object.keys(Stat.weekServs[week]).sort().map(k => {
            let el = Stat.weekServs[week][k]
            el.timestamp = Number.isInteger(el.timestamp) ? (new Date(el.timestamp * 1000)).toLocaleString('ru-RU') : el.timestamp
            list.push(el)
        })
        setDetails(list)
        setModalDetails(true)
    }

    const range = (start, end, length = end - start + 1) => Array.from({ length }, (_, i) => start + i)

    return (
        <div>
            <div className="card">

                <div className="card-header pb-0">
                    <div className="d-lg-flex">
                        <div>
                            <h4 className="mb-0">Сотрудники</h4>
                        </div>
                        <div className="w-100"/>
                        <select style={{display: 'inline-block'}} className="form-control w-auto" value={Year} onChange={(e) => SetYear(e.target.value)}>
                            {range(2022, new Date().getFullYear()).map(year =>
                                <option>{year}</option>
                            )}
                        </select>
                        <select style={{display: 'inline-block'}} className="form-control w-auto ms-3" value={Month} onChange={(e) => SetMonth(e.target.value)}>
                            <option value="1">Январь</option>
                            <option value="2">Февраль</option>
                            <option value="3">Март</option>
                            <option value="4">Апрель</option>
                            <option value="5">Май</option>
                            <option value="6">Июнь</option>
                            <option value="7">Июль</option>
                            <option value="8">Август</option>
                            <option value="9">Сентябрь</option>
                            <option value="10">Октябрь</option>
                            <option value="11">Ноябрь</option>
                            <option value="12">Декабрь</option>
                        </select>
                    </div>
                </div>
                <div className="card-body">
                    {hasAllZPAccess && roles.map((el) =>
                        <div>
                            <h6>{el.name}</h6>
                                <div style={{display: 'flex', gap: '0 20px', flexWrap: 'wrap'}}>
                                    {Units.filter(v => v.active && v.roles.filter(role => role.id == el.id).length).map(v =>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="radio" id={'flexSwitchCheck_' + v.id} name="bubu" value={v.id} onChange={(e) => SetWorker(e.currentTarget.value)}/>
                                            <label className="form-check-label" htmlFor={'flexSwitchCheck_' + v.id}>{v.fio.replace(' ', '\u00A0')}</label>
                                        </div>
                                    )}
                                </div>
                        </div>
                    )}

                    {Stat &&
                    <div className="d-grid d-md-block">
                        <h4 className="mt-3">{Stat.fio}</h4>
                        {Stat.stat &&
                        <>
                            <b><span className="ps-3 ps-md-0 text-secondary">Выручка:</span> {Intl.NumberFormat("ru").format(Stat.stat.total)}</b>
                            <b><span className="ps-3 text-secondary">Начислено:</span> {Intl.NumberFormat("ru").format(Stat.stat.accrued)}</b>
                            <b><span className="ps-3 text-secondary">Выдано:</span> {Intl.NumberFormat("ru").format(Stat.stat.accrued - Stat.stat.toPay)}</b>
                            <b><span className="ps-3 text-secondary">К оплате:</span> {Intl.NumberFormat("ru").format(Stat.stat.toPay)}</b>
                            {hasAllZPAccess &&
                            <button className="btn bg-gradient-info ms-4"
                                    onClick={() => setModalPaymentAdd(true)}>Выдать ЗП
                            </button>
                            }

                            {Stat.bonus &&
                                <>
                                    <br/>
                                    <b><span className="ps-3 ps-md-0 text-secondary">Бонус приемки:</span> {Intl.NumberFormat("ru").format(Stat.bonus.addPriemka)}</b>
                                    <b><span className="ps-3 text-secondary">Бонус за план:</span> {Intl.NumberFormat("ru").format(Stat.bonus.addPlan)}</b>
                                    <b><span className="ps-3 text-secondary">Доп. продажи:</span> {Intl.NumberFormat("ru").format(Stat.bonus.addSale)}</b>
                                </>
                            }

                            <div className="row">
                                {Stat.stat.dayStat &&
                                <div className="col-md-9">
                                    <div className="row">
                                        {Stat.weekServs && Object.keys(Stat.weekServs).map(k =>
                                            <div className="col-md-4 col-lg-3 col-sm-6">
                                                <div className="card mb-3 cursor-pointer" onClick={() => setModalDetails(k)}>
                                                    <div className="card-body p-3">
                                                        <span>{k} нед.</span>
                                                        <span className="float-end text-bold">{Intl.NumberFormat("ru").format(Stat.stat.weekStat[k].summ)}</span>
                                                        <br/>
                                                        <span className="float-end">И: <span className="text-bold">{Object.keys(Stat.stat.weekStat[k].items).length}</span> У: <span className="text-bold">{Object.keys(Stat.weekServs[k]).length}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                }
                                {Stat.payments && Stat.payments.length !== 0 &&
                                <div className="col-md-3">
                                    <h6 className="mb-3">История выдач</h6>
                                    <TimeLineZP timeline={Stat.payments}/>
                                </div>
                                }
                            </div>
                        </>
                        }
                    </div>
                    }
                </div>
            </div>
            {Stat &&
            <Modal id="servs" title="Список услуг" onClose={() => setModalDetails(false)} show={modalDetails}>

                <table className="table text-center">
                    <tr>
                        <th>Время</th>
                        <th>Заказ</th>
                        <th>Сумма</th>
                        <th>Скидка</th>
                    </tr>
                {modalDetails && Object.keys(Stat.stat.weekStat[modalDetails].days).reverse().map(k =>
                    <>
                        <tr>
                            <td colSpan={4} style={{backgroundColor: '#627594', color: '#fff', fontWeight: 'bold'}}>{k}&nbsp;&nbsp;&nbsp;И: {Object.keys(Stat.stat.weekStat[modalDetails].days[k].items).length},&nbsp;&nbsp;У: {Stat.stat.weekStat[modalDetails].days[k].cnt},&nbsp;&nbsp;С: {Stat.stat.weekStat[modalDetails].days[k].summ}</td>
                        </tr>
                        {Object.keys(Stat.stat.weekStat[modalDetails].days[k].list).sort().map(dk => {
                            const el = Stat.stat.weekStat[modalDetails].days[k].list[dk]

                            return (
                            <tr onClick={() => navigate('/orders/' + el.orderId)}>
                                <td>{moment(el.acceptedAt).format('LT')}</td>
                                <td>{el.orderId+'_'+el.itemId}</td>
                                <td>{parseInt(el.amount)}</td>
                                <td>{parseInt(el.discount)}</td>
                            </tr>
                        )})}
                    </>
                )}
                </table>
            </Modal>
            }
            {Stat &&
            <PaymentAdd hiddenComment={'ZP:'+Worker+':'+Year+':'+Month} payed={(sum) => {
                setInfo()
                setModalPaymentAdd(false)
            }} modal={modalPaymentAdd} closeModal={() => setModalPaymentAdd(false)}/>
            }
        </div>
    );
};

export default Units;
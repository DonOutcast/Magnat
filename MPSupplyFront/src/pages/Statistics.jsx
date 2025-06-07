import React, {useEffect, useState} from 'react';
import Chart from 'react-apexcharts'
import StatService from "../API/StatService";
import OrderTR from "../components/Order/OrderTR";

const Statistics = () => {
    const defaultOptions = {
        chart: {
            id: "basic-bar",
            height: 'auto'
        },
        dataLabels: {
            formatter: function (val, opts) {
                return parseInt(val) > 1000 ? parseInt(val/1000) : val
            },
            background: {
                padding: 10
            }
        },
        plotOptions: {
            bar: {
                colors: {
                    ranges: [{
                        from: -100,
                        to: -1,
                        color: '#ea0606'
                    }, {
                        from: 0,
                        to: 100,
                        color: '#82d616'
                    }]
                },
                columnWidth: '80%',
            }
        },
        colors:['#8392ab', '#3a416f', '#17ad37'],
        yaxis: [
            {
                min: 0,
                max: 0
            },
            {
                min: 0,
                max: 0
            },
            {

                min: -50,
                max: 50
            }
        ],
        fill: {
            opacity: [1, 1, 1]
        },
        stroke: {
            width: [6, 6, 0],
            curve: 'smooth'
        },
        xaxis: {
            categories: ['Январь' , 'Февраль' , 'Март' , 'Апрель' , 'Май' , 'Июнь' , 'Июль' , 'Август' , 'Сентябрь' , 'Октябрь' , 'Ноябрь' , 'Декабрь'],
        }
    }
    const [options, setOptions] = useState({})
    const [options2, setOptions2] = useState({})
    const [data, setData] = useState([])
    const [data2, setData2] = useState([])
    const [ZPData, setZPData] = useState({})
    const [cashBoxData, setCashBoxData] = useState({})

    const [Year, SetYear] = useState(new Date().getFullYear())

    async function getData() {
        const res = await StatService.getYear(Year)

        if (!res.error) {
            setZPData(res.zp)
            setData(res.year)
            setData2(res.priem)
            setCashBoxData(res.cashbox)

            let opt = {...defaultOptions}

            opt.title = {text: 'Выручка за год'};
            opt.chart = {id: "id-year", height: 'auto'};

            opt.yaxis = []
            opt.stroke.width = []
            opt.fill.opacity = []

            for (let i = 0; i < res.yearOptions.count; i++) {
                opt.yaxis.push({min: res.yearOptions.min, max: res.yearOptions.max, show: i === 0, floating: false})
                opt.stroke.width.push(3)
                opt.fill.opacity.push(1)
            }
            opt.yaxis.push({min: -25, max: 50, show: 0})
            opt.stroke.width.push(0)
            opt.fill.opacity.push(.7)

            setOptions(opt)

            let opt2 = {...defaultOptions}

            opt2.title = {text: 'Приемка за год'};
            opt2.chart = {id: "id-priem", height: 'auto'};

            opt2.yaxis = []
            opt2.stroke.width = []
            opt2.fill.opacity = []

            for (let i = 0; i < res.priemOptions.count; i++) {
                opt2.yaxis.push({min: res.priemOptions.min, max: res.priemOptions.max, show: i === 0, floating: false})
                opt2.stroke.width.push(3)
                opt2.fill.opacity.push(1)
            }
            opt2.yaxis.push({min: -25, max: 50, show: 0})
            opt2.stroke.width.push(0)
            opt2.fill.opacity.push(.7)

            setOptions2(opt2)
        }
    }

    useEffect(() => {
        getData()
    }, [Year]);


    const range = (start, end, length = end - start + 1) => Array.from({ length }, (_, i) => start + i)

    return (
        <div>
            <div className="row">

                <div className="col-12 col-md-12">

                    <div className="card dataTable-wrapper p-3">
                        <select style={{display: 'inline-block'}} className="form-control w-auto" value={Year} onChange={(e) => SetYear(e.target.value)}>
                            {range(2022, new Date().getFullYear()).map(year =>
                                <option>{year}</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-12 col-md-6">

                    <div className="card dataTable-wrapper p-3 pb-0">
                        <Chart
                            options={options}
                            series={data}
                            type="area"
                        />
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="card dataTable-wrapper p-3 pb-0">
                        <Chart
                            options={options2}
                            series={data2}
                            type="area"
                        />
                    </div>
                </div>
                {ZPData &&
                <div className="col-12 mt-4">
                    <div className="card dataTable-wrapper">
                        <div className="table-responsive">
                            <table className="table align-items-center text-center mb-0 text-sm">
                                <thead>
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Фамилия</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Январь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Февраль</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Март</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Апрель</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Май</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Июнь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Июль</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Август</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Сентябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Октябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Ноябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Декабрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">За
                                        год
                                    </th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">К
                                        оплате
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {ZPData.workers && ZPData.workers.map(worker =>
                                    <tr>
                                        <td>{worker.fio}</td>
                                        {worker.data.map(data =>
                                            <td>{Intl.NumberFormat("ru").format(data)}</td>
                                        )}
                                        <td>{Intl.NumberFormat("ru").format(worker.total)}</td>
                                        <td>{Intl.NumberFormat("ru").format(worker.toPay)}</td>
                                    </tr>
                                )}
                                <tr className="font-weight-bolder">
                                    <td>Итого:</td>
                                    {ZPData.total && ZPData.total.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}</td>
                                    )}
                                    <td>{Intl.NumberFormat("ru").format(ZPData.totalToPay)}</td>
                                </tr>
                                <tr className="font-weight-bolder">
                                    <td>% от выручки:</td>
                                    {ZPData.percent && ZPData.percent.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}%</td>
                                    )}
                                    <td></td>
                                </tr>
                                <tr className="font-weight-bolder">
                                    <td>Чистка:</td>
                                    {ZPData.clear && ZPData.clear.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}</td>
                                    )}
                                </tr>
                                <tr className="font-weight-bolder">
                                    <td>Ремонт:</td>
                                    {ZPData.fix && ZPData.fix.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}</td>
                                    )}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                }
                {cashBoxData &&
                <div className="col-12 mt-4">
                    <div className="card dataTable-wrapper">
                        <div className="table-responsive">
                            <table className="table align-items-center text-center mb-0 text-sm">
                                <thead>
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Тип</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Январь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Февраль</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Март</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Апрель</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Май</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Июнь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Июль</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Август</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Сентябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Октябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Ноябрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Декабрь</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">За
                                        год
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {cashBoxData.byMonthAndType && Object.keys(cashBoxData.byMonthAndType).map(type =>
                                    <tr>
                                        <td>{cashBoxData.byMonthAndType[type].title}</td>
                                        {cashBoxData.byMonthAndType[type].data.map(data =>
                                            <td>{Intl.NumberFormat("ru").format(data)}</td>
                                        )}
                                    </tr>
                                )}
                                <tr className="font-weight-bolder">
                                    <td>Выручка:</td>
                                    {cashBoxData.calculated && cashBoxData.calculated.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}</td>
                                    )}
                                </tr>
                                <tr className="">
                                    <td>Косвенные:</td>
                                    {cashBoxData.uncalculated && cashBoxData.uncalculated.map(data =>
                                        <td>{Intl.NumberFormat("ru").format(data)}</td>
                                    )}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                }
            </div>
        </div>
    );
};

export default Statistics;
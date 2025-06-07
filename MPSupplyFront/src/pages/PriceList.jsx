import React, {useEffect, useState} from 'react';
import ServiceRAPI from "../API/ServiceRAPI";
import {useTitle} from "../hooks/useTitle";

const PriceList = () => {
    useTitle('Календарь задач')

    const [List, SetList] = useState([])

    async function getList()
    {
        const res1 = await ServiceRAPI.AllServicesByGroup(1)
        const res2 = await ServiceRAPI.AllServicesByGroup(2)
        const res3 = await ServiceRAPI.AllServicesByGroup(3)

        if (!res1.error) {
            SetList([
                {name: '', items: res1},
                {name: '', items: res2},
                {name: '', items: res3}
            ])
        }
    }

    useEffect(function () {
        getList()
    }, [])

    return (
        <div className="row">
            {List.map(l0 =>
            <div className="col-md-6 col-lg-4">
                <div className="card">
                    <div className="table-responsive">
                        <table className="table wrap-unset align-items-center mb-0">
                            <thead>
                                <tr>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Наименование</th>
                                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Цена</th>
                                </tr>
                            </thead>
                            <tbody>
                            {l0.items.map(l1 =>
                                <>
                                    <tr key={l1.id}>
                                        <td colSpan={2}><b style={{fontSize: '1.5rem'}}>{l1.name}</b></td>
                                    </tr>
                                    {l1.items.map((l2, i2) =>
                                        <>
                                            {l2.items.length > 0 &&
                                                <>
                                                    <tr key={l2.id}>
                                                        <td colSpan={2}><b>{i2 + 1}. {l2.name}</b></td>
                                                    </tr>
                                                    {l2.items.map((l3, i3) =>
                                                        <tr key={l3.id}>
                                                            <td>{i2 + 1}.{i3 + 1}. {l3.name}</td>
                                                            <td>{l3.price}</td>
                                                        </tr>
                                                    )}
                                                </>
                                            }
                                            {l2.items.length == 0 &&
                                                <tr key={l2.id}>
                                                    <td><b>{i2 + 1}. {l2.name}</b></td>
                                                    <td>{l2.price}</td>
                                                </tr>
                                            }
                                        </>
                                    )}
                                </>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default PriceList;
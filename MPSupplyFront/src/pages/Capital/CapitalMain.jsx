import React, { useEffect, useState } from 'react';
import CapitalRAPI from '../../API/CapitalRAPI';
import { useTitle } from '../../hooks/useTitle';
import { toast } from 'react-toastify';
import { CAPITAL_ASSETS } from './Capital.types';

const CapitalMain = () => {
    useTitle('Капитал');
    const [CapitalArr, SetCapitalArr] = useState([]);
    const [Total, SetTotal] = useState({
        liability: 0,
        asset: 0,
        total: 0,
    });

    async function fetch() {
        const [liabRes, assetsRes] = await Promise.all([CapitalRAPI.LiabilitiesGetAll(), CapitalRAPI.AssetsGetAll()]);

        if (liabRes.error || assetsRes.error) {
            toast.error('Ошибка при загрузке данных');
            return;
        }

        const tableArray = [];
        const maxLen = Math.max(liabRes.length, assetsRes.length);

        let liabilityTotal = 0;
        let assetTotal = 0;

        for (let i = 0; i < maxLen; i++) {
            tableArray.push({
                liability: liabRes[i] || {},
                asset: assetsRes[i] || {},
            });

            liabilityTotal += (liabRes[i] || {}).amount || 0;
            assetTotal += (assetsRes[i] || {}).amount || 0;
        }

        SetCapitalArr(tableArray);
        SetTotal({
            liability: parseInt(liabilityTotal),
            asset: parseInt(assetTotal),
            total: parseInt(assetTotal - liabilityTotal),
        });
    }

    useEffect(() => {
        fetch();
    }, []);

    return (
        <div>
            <div className="card">
                <div className="card-header pb-0">
                    <div className="d-lg-flex justify-content-between">
                        <div>
                            <h5 className="mb-0">Капитал</h5>
                        </div>
                    </div>
                </div>
                <div className="card-body px-0 pb-0">
                    <table className="table text-center">
                        <thead>
                            <tr>
                                <th>Наименование актива</th>
                                <th>Сумма Автива (руб)</th>
                                <th>Сумма Пассива (руб)</th>
                                <th>Наименование пассива</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CapitalArr.map((el, indx) => (
                                <tr key={indx}>
                                    <td>{CAPITAL_ASSETS[el.asset.type].title || el.asset.type}</td>
                                    <td>{Intl.NumberFormat('ru').format(parseInt(el.asset.amount || 0))}</td>
                                    <td>{Intl.NumberFormat('ru').format(el.liability.amount || 0)}</td>
                                    <td>{el.liability.name}</td>
                                </tr>
                            ))}
                            <tr className="text-bold">
                                <td className="text-end">Подитог:</td>
                                <td className="text-success">{Intl.NumberFormat('ru').format(Total.asset)}</td>
                                <td className="text-danger">{Intl.NumberFormat('ru').format(Total.liability)}</td>
                                <td></td>
                            </tr>
                            <tr className="text-bold">
                                <td className="text-end">Итого:</td>
                                <td colSpan="2">{Intl.NumberFormat('ru').format(Total.total)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CapitalMain;

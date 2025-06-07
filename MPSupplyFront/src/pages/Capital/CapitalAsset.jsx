import React, { useEffect, useState } from 'react';
import CapitalRAPI from '../../API/CapitalRAPI';
import { useTitle } from '../../hooks/useTitle';
import { toast } from 'react-toastify';
import { CAPITAL_ASSETS } from './Capital.types';

const CapitalAsset = () => {
    useTitle('Активы');
    const [items, SetItems] = useState([]);

    async function getItems() {
        const res = await CapitalRAPI.AssetsGetAll();
        SetItems(res);
    }

    useEffect(() => {
        getItems();
    }, []);

    async function save(item) {
        const res = await CapitalRAPI.AssetsSave(item.type, { amount: item.amount });
        if (!res.error) {
            toast.success('Изменения сохранены');
        }
    }

    async function changeValue(param, indx, value) {
        const newItems = [...items];
        newItems[indx][param] = value;
        SetItems(newItems);
        save(newItems[indx]);
    }

    return (
        <div>
            <div className="card">
                <div className="card-header pb-0">
                    <div className="d-lg-flex justify-content-between">
                        <div>
                            <h5 className="mb-0">Активы</h5>
                        </div>
                    </div>
                </div>
                <div className="card-body px-0 pb-0">
                    <table className="table text-center">
                        <thead>
                            <tr>
                                <th>Актив</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items &&
                                items.length > 0 &&
                                items.map((el, indx) => (
                                    <tr key={indx}>
                                        <td>{CAPITAL_ASSETS[el.type].title || el.type}</td>
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'amount'} type={'number'} readonly={CAPITAL_ASSETS[el.type].auto} />
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const LiabInputComponent = ({ el, name, type, indx, changeValue, readonly }) => (
    <td>
        <div className="form-group m-0">
            <input
                type={type}
                value={el[name]}
                className="form-control"
                disabled={readonly}
                readonly={readonly}
                onChange={e => changeValue(name, indx, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
            />
        </div>
    </td>
);

export default CapitalAsset;

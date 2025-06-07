import React, { useEffect, useState } from 'react';
import CapitalRAPI from '../../API/CapitalRAPI';
import { useTitle } from '../../hooks/useTitle';
import { toast } from 'react-toastify';
import Modal from '../../components/UI/Modal';

const CapitalLiability = () => {
    useTitle('Пассивы');
    const [items, SetItems] = useState([]);

    async function getItems() {
        const res = await CapitalRAPI.LiabilitiesGetAll();
        SetItems(res);
    }

    useEffect(() => {
        getItems();
    }, []);

    async function save(item) {
        const res = await CapitalRAPI.LiabilitiesSave(item.id, item);
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

    const emptyItem = {
        name: '',
        doc_number: '',
        amount: 0,
        doc_date_start: '',
        pay_main: 0,
        pay_percent: 0,
        doc_date_closest: '',
        pay_main_after: 0,
    };

    const [NewItemModal, SetNewItemModal] = useState(false);

    const [newitem, setNewitem] = useState(emptyItem);

    async function createNewItem() {
        const res = await CapitalRAPI.LiabilitiesCreate(newitem);
        if (!res.error) {
            SetNewItemModal(false);
            getItems();
            toast.success('Пассив успешно создан');
            setNewitem(emptyItem);
        }
    }

    async function deleteItem(id) {
        const res = await CapitalRAPI.LiabilitiesDelete(id);
        if (!res.error) {
            getItems();
            toast.success('Пассив успешно удален');
        }
    }

    return (
        <div>
            <div className="card">
                <div className="card-header pb-0">
                    <div className="d-lg-flex justify-content-between">
                        <div>
                            <h5 className="mb-0">Пассивы</h5>
                        </div>
                        <div className="ms-3">
                            <button className="btn btn-icon bg-gradient-success" onClick={() => SetNewItemModal(true)}>
                                Добавить
                            </button>
                        </div>
                    </div>
                </div>
                <div className="card-body px-0 pb-0">
                    <table className="table text-center">
                        <thead>
                            <tr>
                                <th>Наименование займа</th>
                                <th>Номер договора</th>
                                <th>Сумма займа</th>
                                <th>Остаток по ОД</th>
                                <th>Дата займа</th>
                                <th>Платеж по ОД</th>
                                <th>Платеж процентов</th>
                                <th>Дата платежа</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items &&
                                items.length > 0 &&
                                items.map((el, indx) => (
                                    <tr key={indx}>
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'name'} type={'text'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'doc_number'} type={'text'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'amount_init'} type={'number'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'amount'} type={'number'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'doc_date_start'} type={'date'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'pay_main'} type={'number'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'pay_percent'} type={'number'} />
                                        <LiabInputComponent el={el} indx={indx} changeValue={changeValue} name={'doc_date_closest'} type={'date'} />
                                        <td>
                                            <button className="btn btn-icon bg-gradient-danger" onClick={() => deleteItem(el.id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                id="createUser"
                title="Добавить"
                onClose={() => SetNewItemModal(false)}
                show={NewItemModal}
                footerButtons={
                    <button className="btn bg-gradient-success" type="button" onClick={createNewItem}>
                        Добавить
                    </button>
                }
            >
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="text" name={'name'} title={'Наименование займа'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="text" name={'doc_number'} title={'Номер договора'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="number" name={'amount_init'} title={'Сумма займа'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="number" name={'amount'} title={'Остаток по ОД'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="date" name={'doc_date_start'} title={'Дата займа'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="number" name={'pay_main'} title={'Платеж по ОД'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="number" name={'pay_percent'} title={'Платеж процентов'} />
                <LiabCreateInputComponent item={newitem} setItem={setNewitem} type="date" name={'doc_date_closest'} title={'Дата платежа'} />
            </Modal>
        </div>
    );
};

const LiabInputComponent = ({ el, name, type, indx, changeValue }) => (
    <td>
        <div className="form-group m-0">
            <input type={type} value={el[name]} className="form-control" onChange={e => changeValue(name, indx, type === 'number' ? parseFloat(e.target.value) : e.target.value)} />
        </div>
    </td>
);

const LiabCreateInputComponent = ({ item, setItem, name, type, title }) => (
    <div className="form-group">
        <label>{title}</label>
        <input
            type={type}
            className="form-control"
            value={item[name]}
            onChange={e => setItem({ ...item, [name]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
        />
    </div>
);

export default CapitalLiability;

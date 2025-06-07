import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import moment from 'moment';
import 'moment/locale/ru';
import FullFillRAPI from '../API/FullFillRAPI';
import Modal from '../components/UI/Modal';
import { toast } from 'react-toastify';
import { useProductIcon } from '../hooks/useProductIcon';

const OrderFullFillList = () => {
    useTitle('Задания ФФ');
    const [Service, setService] = useState([]);
    const navigate = useNavigate();

    async function FetchData() {
        const res = await FullFillRAPI.getAll();

        setService(res);
    }

    useEffect(() => {
        FetchData();
    }, []);

    async function deleteFF(event, id) {
        event.preventDefault();
        event.stopPropagation();
        const res = await FullFillRAPI.remove(id);
        if (!res.error) FetchData();
    }

    // В пути до склада
    const [inDeliveryFF, setInDeliveryFF] = useState(null);

    async function inDelivery(event, id) {
        event.preventDefault();
        event.stopPropagation();

        const selectedFF = Service.filter(el => el.id === id).length === 1 ? Service.filter(el => el.id === id)[0] : null;

        if (selectedFF) {
            setInDeliveryFF(selectedFF);
        }
    }

    const [inDeliveryFFSettings, setInDeliveryFFSettings] = useState({});
    const [loading, setLoading] = useState(false);

    async function getInDeliverySettingsFn() {
        const res = await FullFillRAPI.getInDeliverySettings(inDeliveryFF.id);

        if (!res.error) {
            setInDeliveryFFSettings(res);
        }
    }

    useEffect(() => {
        if (inDeliveryFF) {
            getInDeliverySettingsFn();
        } else {
            setInDeliveryFFSettings({});
        }
    }, [inDeliveryFF]);

    async function setInDeliverySettingsFn() {
        setLoading(true);
        const res = await FullFillRAPI.setInDeliverySettings(inDeliveryFF.id, inDeliveryFFSettings);
        setLoading(false);

        if (!res.error) {
            setInDeliveryFF(null);
            toast.success('Изменения сохранены');
        }
    }

    async function toggleInDeliveryFFSetting(whName) {
        setInDeliveryFFSettings({ ...inDeliveryFFSettings, [whName]: !inDeliveryFFSettings[whName] });
    }

    return (
        <div>
            <div className="row">
                <h3>Задания ФФ</h3>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <div className="d-flex flex-wrap justify-content-start">
                        <div className="ms-3">
                            <button className="btn btn-icon bg-gradient-primary" onClick={() => navigate('/fullfill/new/?mp=ozon')}>
                                {useProductIcon('ozon')} Новое задание ФФ
                            </button>
                        </div>
                        <div className="ms-3">
                            <button className="btn btn-icon bg-gradient-primary" onClick={() => navigate('/fullfill/new/?mp=wb')}>
                                {useProductIcon('wb')} Новое задание ФФ
                            </button>
                        </div>
                    </div>
                    <div className="card dataTable-wrapper">
                        <div className="table-responsive">
                            <table className="table align-items-center mb-0">
                                <thead>
                                    <tr>
                                        <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Номер</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата создания</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Дата редактирования</th>
                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Service.length > 0 &&
                                        Service.map(el => (
                                            <tr onClick={() => navigate('/fullfill/' + el.id + '?mp=' + el.mp)}>
                                                <td className="">
                                                    {useProductIcon(el.mp)} #{el.id}
                                                </td>
                                                <td className="text-center">{moment(el.createdAt).format('LL LT')}</td>
                                                <td className="text-center">{moment(el.updatedAt).format('LL LT')}</td>
                                                <td className="text-center">
                                                    <button className="btn bg-gradient-danger btn-sm" onClick={e => deleteFF(e, el.id)}>
                                                        Удалить
                                                    </button>
                                                    <button className="btn bg-gradient-light btn-sm ms-2" onClick={e => inDelivery(e, el.id)}>
                                                        В пути
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title={inDeliveryFF ? `#${inDeliveryFF.id} от ${moment(inDeliveryFF.createdAt).format('LL LT')}` : ''}
                id="stock"
                show={inDeliveryFF}
                onClose={() => setInDeliveryFF(null)}
                addClass="modal-100"
                footerButtons={
                    <button className="btn bg-gradient-success" type="button" disabled={loading} onClick={() => setInDeliverySettingsFn()}>
                        Сохранить
                    </button>
                }
            >
                {loading ? (
                    <div>Идет сохранение...</div>
                ) : (
                    <>
                        {Object.keys(inDeliveryFFSettings).length > 0 && (
                            <div style={{ margin: '-1rem' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Склад</th>
                                            <th>В пути</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(inDeliveryFFSettings).map(whName => (
                                            <tr key={whName}>
                                                <td>{whName}</td>
                                                <td>
                                                    <div className="form-check form-switch" style={{ width: 'fit-content', margin: '0 auto' }}>
                                                        <input
                                                            className="form-check-input"
                                                            checked={inDeliveryFFSettings[whName]}
                                                            type="checkbox"
                                                            id="flexSwitchCheckDefault1"
                                                            onChange={() => toggleInDeliveryFFSetting(whName)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default OrderFullFillList;

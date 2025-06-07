import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import SupplierRAPI from '../API/SupplierRAPI';

const SupplierDetail = () => {
    let {id} = useParams()
    const navigate = useNavigate();
    const [client, setClient] = useState({})

    async function fetch() {
        const res = await SupplierRAPI.getById(id)

        if (!res.error) {
            setClient(res)
        }
    }

    async function saveClient() {
        const res = await SupplierRAPI.set(client)

        if (!res.error) {
            setClient(res)
            toast.success('Данные успешно сохранены')
        }
    }

    async function createClient() {
        const res = await SupplierRAPI.add(client)

        if (!res.error) {
            setClient(res)
            toast.success('Данные успешно сохранены')
            navigate('/suppliers/' + res.id)
        }
    }

    useEffect(function() {
        if (id !== 'new') {
            fetch()
        }
    }, [])

    return (
        <div>
            <h3><span className="text-secondary">Поставщик:</span> {client.name}</h3>
            <div className="row">
                <div className="col-md-8">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label>Наименование</label>
                                <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} className="form-control"/>
                            </div>
                        </div>
                        <div className="col-md-12">
                        </div>
                        <div className="col-md-4">
                            <h6>&nbsp;</h6>
                            <button className="btn bg-gradient-success" onClick={id !== 'new' ? saveClient : createClient}>Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-md-12">
                    <h6>Товары</h6>
                    <div className="card dataTable-wrapper">
                        <div className="table-responsive">
                            <table className="table text-center">
                                <thead>
                                    <tr>
                                        <th>Наименование</th>
                                        <th>Цена за шт.</th>
                                        <th>Минимальный закуп</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {client.observables && client.observables.map(el =>
                                        <tr onClick={() => navigate('/observable/' + el.id)}>
                                            <td>{el.name}</td>
                                            <td>{Intl.NumberFormat("ru").format(el.price)}</td>
                                            <td>{Intl.NumberFormat("ru").format(el.minCount)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetail;
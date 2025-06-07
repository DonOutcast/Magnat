import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ObservableRAPI from '../API/ObservableRAPI';
import Modal from '../components/UI/Modal';
import SupplierRAPI from '../API/SupplierRAPI';
import { useProductIcon } from '../hooks/useProductIcon';

const OrderNew = () => {
    let { id } = useParams();
    const navigate = useNavigate();
    const emptyItem = {
        name: '',
        supplierId: '',
        price: 0,
        minCount: 0,
        items: [],
    };
    const [item, setItem] = useState(emptyItem);

    async function fetch() {
        const res = await ObservableRAPI.getById(id);

        if (!res.error) {
            setItem({ ...res, oldName: res.name });
        }
    }

    async function saveClient() {
        if (!hasErrors()) {
            if (id === 'new') {
                const res = await ObservableRAPI.add({ ...item, price: parseFloat(item.price) });

                if (!res.error) {
                    navigate('/observable/' + res.id);
                }
            } else {
                const res = await ObservableRAPI.set({ ...item, price: parseFloat(item.price) });

                if (!res.error) {
                    toast.success('Данные успешно сохранены');
                }
            }
        }
    }

    async function deleteClient() {
        const res = await ObservableRAPI.delete(item.id);

        if (!res.error) {
            navigate('/observable');
        }
    }

    const [suppliers, setSuppliers] = useState([]);
    async function getSuppliers() {
        const res = await SupplierRAPI.search('');

        setSuppliers(res.list);
    }

    useEffect(
        function() {
            setItem(emptyItem);
            if (id !== 'new') {
                fetch();
                setSupplierItems([]);
            }
        },
        [id],
    );

    useEffect(function() {
        getSuppliers();
        getUnobservableItems();
    }, []);

    // Проверка перед сохранением
    function hasErrors() {
        try {
            item.items.forEach(el => {
                if (el.packing <= 0 || isNaN(el.packing)) {
                    throw new Error('Заполните фасовку для всех товаров');
                }
            });
            if (!item.name || !item.price || !item.supplierId || !item.minCount) {
                throw new Error('Заполните все обязательные поля');
            }
        } catch (error) {
            toast.error(error.message);
            return true;
        }

        return false;
    }

    // Список товаров на добавление
    const [unobservableItems, setUnobservableItems] = useState([]);
    const [searchUnobservableItems, setSearchUnobservableItems] = useState('');
    async function getUnobservableItems() {
        setUnobservableItems(await ObservableRAPI.getRequired());
    }

    // Изменение фасовки
    async function changePacking(indx, packing) {
        let buf = { ...item };
        if (!buf.items) {
            buf.items = [];
        }
        buf.items[indx].packing = packing;

        setItem(buf);
    }

    // Изменение типа фасовки
    async function changePackingType(indx, packing) {
        let buf = { ...item };
        if (!buf.items) {
            buf.items = [];
        }
        buf.items[indx].packingType = packing === '' ? null : packing;

        setItem(buf);
    }

    // Удалить из списка добавленнный товар
    async function deleteSelectedItem(el) {
        let buf = [...unobservableItems];
        const index = buf.indexOf(el);
        if (index > -1) {
            buf.splice(index, 1);
        }
        setUnobservableItems(buf);
    }

    // Добавление товара
    async function addItem(el) {
        let buf = { ...item };
        if (!buf.items) {
            buf.items = [];
        }
        buf.items.push({
            productId: el.id,
            product: {
                name: el.name,
                sku: el.sku,
                offer_id: el.offer_id,
                mp: el.mp,
            },
            packing: 0,
            needed: el.needed,
        });

        setItem(buf);
        deleteSelectedItem(el);
    }

    // Просмотр по складам
    const [stockModal, setStockModal] = useState(false);
    const [stock, setStock] = useState([]);

    async function getStock(productId) {
        setStock([]);
        setStockModal(true);
        const res = await ObservableRAPI.getStock(productId);

        setStock(res);
    }

    // Показ товаров для добавления (редактирование)
    const [showUnobservableItems, setShowUnobservableItems] = useState(id === 'new');

    // Список товаров по поставщику
    const [focused, setFocused] = useState(false);
    const [supplierItems, setSupplierItems] = useState([]);
    async function getSupplierItems(supplierId) {
        setSupplierItems([]);
        const res = await ObservableRAPI.getSupplierItems(supplierId);
        setSupplierItems(res);
    }
    useEffect(() => {
        if (item.supplierId !== '') {
            getSupplierItems(item.supplierId);
        }
    }, [item]);

    // Изменение видимости склада
    async function changeVisible(indx) {
        const newStock = [...stock];
        newStock[indx].visible = !newStock[indx].visible;
        setStock(newStock);
        saveVisible(newStock[indx]);
    }

    async function saveVisible(el) {
        const res = await ObservableRAPI.setVisible(el);

        if (!res.error) {
            toast.success('Изменения сохранены');
        }
    }

    const packageTypes = ['БОБ', 'Без упаковки', 'ПВД', 'ТУ', 'Курьер пакет', 'Короб'];

    async function toArchive(el) {
        deleteSelectedItem(el);
        await ObservableRAPI.toArchive(el.id);
    }

    return (
        <div>
            <h3>{id !== 'new' ? item.oldName : 'Новый товар'}</h3>
            <div className="row">
                <div className="col-md-9">
                    <div className="row">
                        <div className="col-md-6">
                            {suppliers.length > 0 && (
                                <div className={'form-group' + (!item.supplierId ? ' has-danger' : '')}>
                                    <label>Поставщик</label>
                                    <select
                                        className={'form-control' + (!item.supplierId ? ' is-invalid' : '')}
                                        value={item.supplierId}
                                        onChange={e => {
                                            setItem({ ...item, supplierId: parseInt(e.target.value) });
                                            getSupplierItems(e.target.value);
                                        }}
                                    >
                                        <option value="">Выберите поставщика...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className={'form-group' + (!item.name ? ' has-danger' : '')}>
                                <label>Наименование</label>
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={e => setItem({ ...item, name: e.target.value })}
                                    className={'form-control' + (!item.name ? ' is-invalid' : '')}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() =>
                                        setTimeout(function() {
                                            setFocused(false);
                                        }, 500)
                                    }
                                />
                                {focused && supplierItems.length > 0 && (
                                    <div style={{ position: 'relative' }}>
                                        <div
                                            className="bg-gradient-primary py-1"
                                            style={{ position: 'absolute', zIndex: 1, width: 'max-content', borderRadius: '5px', color: '#fff', cursor: 'pointer' }}
                                        >
                                            {supplierItems
                                                .filter(f => f.name.toLowerCase().includes(item.name.toLowerCase()))
                                                .map(el => (
                                                    <div className="px-3 py-1 hovtrans" onClick={() => navigate('/observable/' + el.id)}>
                                                        <b>{el.name}</b>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className={'form-group' + (!item.price ? ' has-danger' : '')}>
                                <label>Цена за шт.</label>
                                <input
                                    type="text"
                                    value={item.price}
                                    onChange={e => setItem({ ...item, price: e.target.value.replace(/[^\d,.]/g, '').replace(/[,]/g, '.') })}
                                    className={'form-control' + (!item.price ? ' is-invalid' : '')}
                                />
                            </div>
                            <div className={'form-group' + (!item.minCount ? ' has-danger' : '')}>
                                <label>Минимальный закуп</label>
                                <input
                                    type="number"
                                    value={item.minCount}
                                    onChange={e => setItem({ ...item, minCount: parseInt(e.target.value) })}
                                    className={'form-control' + (!item.minCount ? ' is-invalid' : '')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <h6>&nbsp;</h6>
                    <button className="btn bg-gradient-success" onClick={saveClient}>
                        Сохранить
                    </button>
                    {id !== 'new' && (
                        <button className="btn bg-gradient-danger ms-3" onClick={deleteClient}>
                            <i className="fas fa-trash"></i>
                        </button>
                    )}
                    {id !== 'new' && (
                        <button className="btn bg-gradient-info ms-3" onClick={() => navigate('/stat/item/' + id)}>
                            Аналитика
                        </button>
                    )}
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-md-12">
                    <h6>Товары</h6>
                    {item.items && (
                        <div className="card" style={{ overflow: 'auto' }}>
                            <table className="table text-center">
                                <thead>
                                    <tr>
                                        <th>Наименование</th>
                                        <th>SKU</th>
                                        <th>Артикул</th>
                                        <th>Упаковка</th>
                                        <th>Фасовка</th>
                                        <th>Необходимо уп.</th>
                                        <th>Необходимо шт.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.items.map((el, indx) => (
                                        <tr key={el.id}>
                                            <td style={{ textWrap: 'balance' }}>{el.product.name}</td>
                                            <td>{el.product.sku}</td>
                                            <td>
                                                {useProductIcon(el.product.mp)}
                                                {el.product.offer_id}
                                            </td>
                                            <td>
                                                <div className={'form-group m-0' + (el.packing <= 0 || isNaN(el.packing) ? ' has-danger' : '')}>
                                                    <select className="form-control" value={el.packingType} onChange={e => changePackingType(indx, e.target.value)}>
                                                        <option value="">Выберите ...</option>
                                                        {packageTypes.map(name => (
                                                            <option value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={'form-group m-0' + (el.packing <= 0 || isNaN(el.packing) ? ' has-danger' : '')}>
                                                    <input
                                                        type="number"
                                                        value={el.packing}
                                                        className={'form-control' + (el.packing <= 0 || isNaN(el.packing) ? ' is-invalid' : '')}
                                                        onChange={e => changePacking(indx, parseInt(e.target.value))}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn bg-gradient-primary w-100 m-0" onClick={() => getStock(el.product.id)}>
                                                    {el.needed}
                                                </div>
                                            </td>
                                            <td>{el.needed * el.packing}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-md-12">
                    {showUnobservableItems ? (
                        <>
                            <h6 className="d-flex">
                                Товары для добавления{' '}
                                <input
                                    type="text"
                                    value={searchUnobservableItems}
                                    className="form-control ms-3"
                                    placeholder="Поиск по товарам"
                                    style={{ height: '30px', width: '200px' }}
                                    onChange={e => setSearchUnobservableItems(e.target.value.toLowerCase())}
                                />
                            </h6>
                            {unobservableItems && (
                                <div className="card" style={{ overflow: 'auto', maxHeight: '400px' }}>
                                    <table className="text-center">
                                        <thead>
                                            <tr>
                                                <th>Наименование</th>
                                                <th>SKU</th>
                                                <th>Артикул</th>
                                                <th>Необходимо уп.</th>
                                                <th>Добавить</th>
                                                <th>Отправить в архив</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unobservableItems
                                                .filter(
                                                    f =>
                                                        f.name.toLowerCase().includes(searchUnobservableItems) ||
                                                        f.sku.toLowerCase().includes(searchUnobservableItems) ||
                                                        f.offer_id.toLowerCase().includes(searchUnobservableItems),
                                                )
                                                .map((el, indx) => (
                                                    <tr key={el.id}>
                                                        <td style={{ textWrap: 'balance' }}>{el.name}</td>
                                                        <td>{el.sku}</td>
                                                        <td style={{ textWrap: 'balance', wordBreak: 'break-all' }}>
                                                            {useProductIcon(el.mp)}
                                                            {el.offer_id}
                                                        </td>
                                                        <td>
                                                            <button className="btn bg-gradient-primary w-100 m-0" onClick={() => getStock(el.id)}>
                                                                {el.needed}
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <button className="btn bg-gradient-primary w-100 m-0" onClick={() => addItem(el)}>
                                                                Добавить
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <button className="btn bg-gradient-danger w-100 m-0" onClick={() => toArchive(el)}>
                                                                В архив
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <button className="btn bg-gradient-primary" onClick={() => setShowUnobservableItems(true)}>
                            Показать товары для добавления
                        </button>
                    )}
                </div>
            </div>
            <Modal title="Склады" id="stock" show={stockModal} onClose={() => setStockModal(false)} addClass="modal-100">
                {stock.length > 0 && (
                    <div style={{ margin: '-1rem' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Склад</th>
                                    <th>Видимость</th>
                                    <th>В пути</th>
                                    <th>В продаже</th>
                                    <th>В резерве</th>
                                    <th>Ср. скорость продаж</th>
                                    <th>Необходимо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stock.length > 0 &&
                                    stock.map((el, indx) => (
                                        <tr className={el.visible ? '' : 'text-secondary'}>
                                            <td>{el.name}</td>
                                            <td>
                                                <div className="form-check form-switch" style={{ width: 'fit-content', margin: '0 auto' }}>
                                                    <input
                                                        className="form-check-input"
                                                        checked={el.visible}
                                                        type="checkbox"
                                                        id="flexSwitchCheckDefault1"
                                                        onChange={() => changeVisible(indx)}
                                                    />
                                                </div>
                                            </td>
                                            <td>{el.promised_amount}</td>
                                            <td>{el.free_to_sell_amount}</td>
                                            <td>{el.reserved_amount}</td>
                                            <td>{Intl.NumberFormat('ru').format(el.avg_sale)}</td>
                                            <td>{el.needed > 0 ? <b>{el.needed}</b> : el.needed}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderNew;

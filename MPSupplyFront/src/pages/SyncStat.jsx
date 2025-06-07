import React from 'react';
import { useTitle } from '../hooks/useTitle';
import { useTypedSelector } from '../hooks/useTypedSelector';
import moment from 'moment';

const SyncStat = () => {
    useTitle('Статистика синхронизации');

    const user = useTypedSelector(state => state.itemRefs.user);

    const syncData = user.cabinetes.filter(cabinet => cabinet.id === parseInt(user.cid))[0].syncData;

    return (
        <div>
            <div className="row">
                {'products' in syncData && (
                    <div className="col-md-4">
                        <h4>
                            Товары <span className="text-sm text-second text-normal">({moment(syncData.products.lastSync).fromNow()})</span>
                        </h4>
                        <h5>Ozon</h5>
                        <div>
                            <p>Кол-во SKU: {syncData.products.ozon.total}</p>
                        </div>
                        <h5>WB</h5>
                        <div>
                            <p>Кол-во SKU: {syncData.products.wb.total}</p>
                        </div>
                    </div>
                )}
                {'sales' in syncData && (
                    <div className="col-md-4">
                        <h4>
                            Продажи <span className="text-sm text-second text-normal">({moment(syncData.sales.lastSync).fromNow()})</span>
                        </h4>
                        <h5>Ozon</h5>
                        <div>
                            <p>Кол-во проданнных SKU: {syncData.sales.ozon.totalSKU}</p>
                            <p>Не найденные SKU: {syncData.sales.ozon.undefinedSKUs.join(', ')}</p>
                        </div>
                        <h5>WB</h5>
                        <div>
                            <p>Кол-во проданнных SKU: {syncData.sales.wb.totalSKU}</p>
                            <p>Не найденные SKU: {syncData.sales.wb.undefinedSKUs.join(', ')}</p>
                        </div>
                    </div>
                )}
                {'stock' in syncData && (
                    <div className="col-md-4">
                        <h4>
                            Продажи <span className="text-sm text-second text-normal">({moment(syncData.stock.lastSync).fromNow()})</span>
                        </h4>
                        <h5>Ozon</h5>
                        <div>
                            <p>Кол-во SKU в остатках: {syncData.stock.ozon.totalSKU}</p>
                            <p>Не найденные SKU: {syncData.stock.ozon.undefinedSKUs.join(', ')}</p>
                        </div>
                        <h5>WB</h5>
                        <div>
                            <p>Кол-во SKU в остатках: {syncData.stock.wb.totalSKU}</p>
                            <p>Не найденные SKU: {syncData.stock.wb.undefinedSKUs.join(', ')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyncStat;

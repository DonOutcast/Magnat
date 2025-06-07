import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import StatService from '../API/StatService';
import { useTitle } from '../hooks/useTitle';

const Settings = () => {
    useTitle('Настройки кабинета');
    const [settings, setSettings] = useState([]);

    async function fetch() {
        const res = await StatService.getSettings();

        if (!res.error) {
            setSettings(res);
        }
    }

    async function saveSettings() {
        const res = await StatService.setSettings(settings);

        if (!res.error) {
            toast.success('Данные успешно сохранены');
        }
    }

    function getSettingValue(module, code) {
        const target = settings.filter(el => el.module === module && el.code === code);
        return target.length === 1 ? target[0].value : '';
    }

    function setSettingValue(e) {
        const module = e.target.dataset.module;
        const code = e.target.dataset.code;
        let value = e.target.value;

        if (e.target.type === 'number') {
            value = isNaN(parseInt(value)) ? 0 : parseInt(value);
        }

        const copySettings = [...settings];

        let needCreate = true;

        copySettings.map(el => {
            if (el.module === module && el.code === code) {
                el.value = value;
                needCreate = false;
            }
            return el;
        });

        if (needCreate) {
            copySettings.push({
                module,
                code,
                value,
            });
        }

        setSettings(copySettings);
    }

    useEffect(function() {
        fetch();
    }, []);

    const settingTabs = [
        {
            items: [
                {
                    title: 'Кол-во дней для резезва на складе ФФ',
                    module: 'Calc',
                    code: 'reserveCalcDays',
                    type: 'number',
                },
                {
                    title: 'Кол-во дней для расчета скорости продаж',
                    module: 'Calc',
                    code: 'saleCalcDays',
                    type: 'number',
                },
            ],
        },
        {
            items: [
                {
                    title: 'Ozon Client Id',
                    module: 'API',
                    code: 'ozonClientId',
                    type: 'number',
                },
                {
                    title: 'Ozon Api Key',
                    module: 'API',
                    code: 'ozonApiKey',
                    type: 'text',
                },
                {
                    title: 'WB Api Key',
                    module: 'API',
                    code: 'wbApiKey',
                    type: 'text',
                },
            ],
        },
    ];

    return (
        <div>
            <div className="d-lg-flex justify-content-between">
                <div>
                    <h5 className="mb-0">Настройки</h5>
                </div>
                <div className="ms-3">
                    <button className="btn btn-icon bg-gradient-success" onClick={saveSettings}>
                        Сохранить
                    </button>
                </div>
            </div>
            <div className="row">
                {settingTabs.map((tab, indx) => (
                    <div className="col-md-6" key={indx}>
                        {tab.items.map((param, pindx) => (
                            <div className="form-group" key={pindx}>
                                <label>{param.title}</label>
                                <input
                                    data-module={param.module}
                                    data-code={param.code}
                                    value={getSettingValue(param.module, param.code)}
                                    onChange={setSettingValue}
                                    className="form-control"
                                    type={param.type}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;

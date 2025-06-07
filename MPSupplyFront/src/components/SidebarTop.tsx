import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { title } from 'process';

const SidebarTop = (props: { logout: () => void; changeCabinet: (cabinetId: number) => void }) => {
    const user = useTypedSelector(state => state.itemRefs.user);

    const menuItems = [
        {
            title: 'Товары',
            items: [
                { title: 'Настройка', link: '/item_settings', icon: 'fas fa-edit' },
                {
                    title: 'Новый товар',
                    link: '/observable/new',
                    icon: 'fas fa-plus-square',
                },
                {
                    title: 'Не отслеживаемые',
                    link: '/required',
                    icon: 'fas fa-eye-slash',
                },
            ],
        },
        {
            title: 'Поставки',
            items: [
                { title: 'Потребность', link: '/needed', icon: 'fas fa-box-open' },
                { title: 'Заказы поставщикам', link: '/orders', icon: 'fas fa-cubes' },
                { title: 'В пути', link: '/inway', icon: 'fas fa-boxes' },
            ],
        },
        {
            title: 'Фулфилмент',
            items: [
                { title: 'Остатки', link: '/fullfillstock', icon: 'fas fa-boxes' },
                { title: 'Задания ФФ', link: '/fullfill', icon: 'fas fa-people-carry' },
            ],
        },
        {
            title: 'Статистика',
            items: [
                { title: 'Оборачиваемость Ozon', link: '/stat/salespeed/ozon', icon: 'fas fa-undo' },
                { title: 'Оборачиваемость WB', link: '/stat/salespeed/wb', icon: 'fas fa-undo' },
            ],
        },
        {
            title: 'Финансы',
            items: [
                { title: 'Капитал', link: '/finance/capital', icon: 'fas fa-question' },
                { title: 'Активы', link: '/finance/asset', icon: 'fas fa-question' },
                { title: 'Пассивы', link: '/finance/liability', icon: 'fas fa-question' },
            ],
        },
        {
            title: 'Настройки',
            items: [
                { title: 'Поставщики', link: '/suppliers', icon: 'fas fa-id-card-alt' },
                { title: 'Склады Ozon', link: '/warehouses/ozon', icon: 'fas fa-warehouse' },
                { title: 'Склады WB', link: '/warehouses/wb', icon: 'fas fa-warehouse' },
                { title: 'Пользователи', link: '/users', icon: 'fas fa-user' },
                { title: 'Настройки', link: '/settings', icon: 'fas fa-tools' },
                { title: 'Синхронизация', link: '/sync', icon: 'fas fa-tools' },
                {
                    title: 'Выход',
                    link: '#',
                    icon: 'fas fa-sign-out-alt',
                    logoutBtn: true,
                },
            ],
        },
        {
            title: (
                <>
                    <i className="fas fa-id-card me-2" style={{ fontSize: '1rem' }}></i>{' '}
                    {'cid' in user && user.cabinetes.filter(cabinet => cabinet.id == user.cid).length === 1
                        ? user.cabinetes.filter(cabinet => cabinet.id == user.cid)[0].name
                        : 'Кабинет'}
                </>
            ),
            items:
                'cabinetes' in user
                    ? user.cabinetes.map(cabinet => ({
                          title: cabinet.name,
                          link: '#',
                          icon: 'fas fa-sign-in-alt',
                          cabinetBtn: true,
                          cabinetId: cabinet.id,
                      }))
                    : [],
        },
    ];

    const [collapsed, setCollapse] = useState(true);
    const [collapsedL1, setCollapseL1] = useState('');

    async function linkClickHandler(l2: any) {
        if (l2.logoutBtn) {
            props.logout();
        }
        if (l2.cabinetBtn) {
            props.changeCabinet(l2.cabinetId);
        }
        setCollapse(true);
    }

    return (
        <div className="--container position-sticky z-index-sticky top-0">
            <div className="row">
                <div className="col-12">
                    <nav className="navbar navbar-expand-lg blur blur-rounded top-0 z-index-3 shadow position-absolute my-3 py-2 start-0 end-0 mx-4">
                        <div className="container-fluid">
                            <a className="navbar-brand font-weight-bolder ms-lg-0 ms-3" href="/">
                                {process.env.REACT_APP_TITLE}
                            </a>
                            <button
                                onClick={() => setCollapse(!collapsed)}
                                className={'navbar-toggler shadow-none ms-2 ' + (collapsed ? 'collapsed' : '')}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#navigation"
                                aria-controls="navigation"
                                aria-expanded={!collapsed}
                                aria-label="Toggle navigation"
                            >
                                <span className="navbar-toggler-icon mt-2">
                                    <span className="navbar-toggler-bar bar1"></span>
                                    <span className="navbar-toggler-bar bar2"></span>
                                    <span className="navbar-toggler-bar bar3"></span>
                                </span>
                            </button>
                            <div className={'navbar-collapse w-100 pt-3 pb-2 py-lg-0 collapse ' + (collapsed ? '' : 'show')} id="navigation">
                                <ul className="navbar-nav navbar-nav-hover mx-auto">
                                    {menuItems.map(l1 => (
                                        <li key={'' + l1.title} className="nav-item dropdown dropdown-hover mx-2">
                                            <div
                                                onClick={() => (collapsedL1 == l1.title ? setCollapseL1('') : setCollapseL1('' + l1.title))}
                                                role="button"
                                                className={
                                                    'nav-link ps-2 d-flex justify-content-between cursor-pointer align-items-center ' + (collapsedL1 == l1.title ? 'show' : '')
                                                }
                                                id="dropdownMenuBlocks"
                                                data-bs-toggle="dropdown"
                                                aria-expanded={collapsedL1 == l1.title}
                                            >
                                                {l1.title}
                                                <img src="/assets/img/down-arrow-dark.svg " alt="down-arrow" className="arrow ms-1 d-lg-block d-none" />
                                                <img src="/assets/img/down-arrow-dark.svg" alt="down-arrow" className="arrow ms-1 d-lg-none d-block" />
                                            </div>
                                            <div
                                                className={
                                                    'dropdown-menu dropdown-menu-animation dropdown-md dropdown-md-responsive p-3 border-radius-lg mt-0 mt-lg-3 ' +
                                                    (collapsedL1 == l1.title ? 'show' : '')
                                                }
                                                aria-labelledby="dropdownMenuBlocks"
                                            >
                                                <div className="d-none d-lg-block">
                                                    <ul className="list-group">
                                                        {l1.items.map(l2 => (
                                                            <li key={l2.title} className="nav-item dropdown dropdown-hover dropdown-subitem list-group-item border-0 p-0">
                                                                <Link onClick={() => linkClickHandler(l2)} className="dropdown-item py-2 ps-3 border-radius-md" to={l2.link}>
                                                                    <div className="d-flex">
                                                                        <div className="icon h-10 me-3 d-flex mt-1">
                                                                            <i className={l2.icon} style={{ color: '#2b2a29' }}></i>
                                                                        </div>
                                                                        <div className="w-100 d-flex align-items-center justify-content-between">
                                                                            <div>
                                                                                <p className="dropdown-header text-dark p-0">{l2.title}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="row d-lg-none">
                                                    <div className="col-md-12">
                                                        {l1.items.map(l2 => (
                                                            <Link key={l2.title} onClick={() => linkClickHandler(l2)} className="py-2 ps-3 border-radius-md" to={l2.link}>
                                                                <div className="d-flex">
                                                                    <div className="icon h-10 me-3 d-flex mt-1">
                                                                        <i className={l2.icon} style={{ color: '#2b2a29' }}></i>
                                                                    </div>
                                                                    <div className="w-100 d-flex align-items-center justify-content-between">
                                                                        <div>
                                                                            <p className="dropdown-header text-dark p-0">{l2.title}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default SidebarTop;

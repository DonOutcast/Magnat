import React from 'react';
import { NavLink } from "react-router-dom";
import { useTypedSelector } from "../hooks/useTypedSelector";

const Sidebar = (props: { pin: boolean, disablePin: () => void, logout: () => void }) => {

    const classes = 'sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-3 ' + (props.pin ? 'bg-white' : '')

    const accesses = useTypedSelector(state => state.itemRefs.user.accesses)

    const menuItems = [
        { title: 'Товары настройка', link: '/item_settings', access: 'orders', icon: 'fas fa-store' },
        { title: 'Новый товар', link: '/observable/new', access: 'orders', icon: 'fas fa-store' },
        { title: 'Потребность', link: '/needed', access: 'orders', icon: 'fas fa-store' },
        { title: 'Заказы', link: '/orders', access: 'orders', icon: 'fas fa-store' },
        { title: 'Остатки', link: '/fullfillstock', access: 'orders', icon: 'fas fa-store' },
        { title: 'Задания ФФ', link: '/fullfill', access: 'orders', icon: 'fas fa-store' },
        { title: 'Не отслеживаемые', link: '/required', access: 'orders', icon: 'fas fa-eye-slash' },
        { title: 'Поставщики', link: '/suppliers', access: 'orders', icon: 'fas fa-id-card-alt' },
        { title: 'Склады', link: '/warehouses', access: 'users', icon: 'fas fa-warehouse' },
        { title: 'Пользователи', link: '/users', access: 'users', icon: 'fas fa-user' },
    ]

    return (
        <aside
            className={classes}
            id="sidenav-main">
            <div className="sidenav-header">
                <i className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-none d-xl-none"
                    aria-hidden="true" id="iconSidenav"></i>
                <NavLink className="navbar-brand m-0" to="/">
                    <span className="ms-1 font-weight-bold">{process.env.REACT_APP_TITLE}</span>
                </NavLink>
            </div>
            <hr className="horizontal dark mt-0" />
            <div className="collapse navbar-collapse  w-auto " id="sidenav-collapse-main">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <NavLink onClick={props.disablePin} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-home"></i>
                            </div>
                            <span className="nav-link-text ms-1">Главная</span>
                        </NavLink>
                    </li>
                    {menuItems.map(menuItem =>
                        <>
                            {accesses.includes(menuItem.access) &&
                                <li className="nav-item">
                                    <NavLink onClick={props.disablePin}
                                        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                                        to={menuItem.link}>
                                        <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                            <i className={menuItem.icon}></i>
                                        </div>
                                        <span className="nav-link-text ms-1">{menuItem.title}</span>
                                    </NavLink>
                                </li>
                            }
                        </>
                    )}
                    <li className="nav-item">
                        <div className="nav-link" style={{ cursor: 'pointer' }} onClick={props.logout}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-door-open"></i>
                            </div>
                            <span className="nav-link-text ms-1">Выход</span>
                        </div>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
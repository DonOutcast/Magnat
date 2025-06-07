import React from 'react';
import {NavLink} from "react-router-dom";

const Navbar = (props: {toggleSidebar: () => void, user: any}) => {
    return (
        <nav
            className="navbar navbar-main navbar-expand-lg position-sticky mt-4 top-1 px-0 mx-4 border-radius-xl z-index-sticky blur shadow-blur left-auto"
            id="navbarBlur" data-scroll="true">
            <div className="container-fluid py-1 px-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
                        <li className="breadcrumb-item text-sm">
                            {props.user.fio}
                        </li>
                    </ol>
                </nav>
                <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
                    <ul className="ms-md-auto navbar-nav  justify-content-end">
                        <li className="nav-item ps-3 px-3 d-flex align-items-center">
                            <div onClick={props.toggleSidebar} className="nav-link p-0" id="iconNavbarSidenav">
                                <div className="sidenav-toggler-inner">
                                    <i className="sidenav-toggler-line bg-dark"></i>
                                    <i className="sidenav-toggler-line bg-dark"></i>
                                    <i className="sidenav-toggler-line bg-dark"></i>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
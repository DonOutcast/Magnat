import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import {useTypedSelector} from "../hooks/useTypedSelector";

const CheckAccess = ({ accesses }) => {
    const location = useLocation();
    const userAccesses = useTypedSelector(state => state.itemRefs.user.accesses)

    return accesses.some(r=> userAccesses.includes(r)) ? (
        <Outlet/>
    ) : (
        <Navigate to="/" state={{ from: location }} replace />
    );
};

export default CheckAccess;
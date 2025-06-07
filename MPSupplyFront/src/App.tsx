import React, { useEffect, useReducer, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./pages/Main";
import Orders from "./pages/Orders";
import { useDispatch } from "react-redux";
import { actionTypes } from "./types/masters";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StatService from "./API/StatService";
import WarehouseMain from "./pages/WarehouseMain";
import Auth from "./pages/Auth";
import axios from "axios";
import Users from "./pages/Users";
import { UserDetail } from "./pages/UserDetail";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import OrderInOurStock from "./pages/OrdersInOurStock";
import OrderNew from "./pages/OrderNew";
import Required from "./pages/Required";
import OrdersEdit from "./pages/OrdersEdit";
import OrdersNeeded from "./pages/OrdersNeeded";
import OrderSupplyDetail from "./pages/OrderSupplyDetail";
import OrderSupplyList from "./pages/OrderSupplyList";
import OrderFullFillList from "./pages/OrderFullFillList";
import OrderFullFillDetail from "./pages/OrderFullFillDetail";
import SidebarTop from "./components/SidebarTop";
import Settings from "./pages/Settings";
import StatSaleSpeed from "./pages/StatSaleSpeed";
import OrderInWay from "./pages/OrdersInWay";
import CapitalMain from "./pages/Capital/CapitalMain";
import CapitalLiability from "./pages/Capital/CapitalLiability";
import CapitalAsset from "./pages/Capital/CapitalAsset";
import SyncStat from "./pages/SyncStat";
import AnalObsItem from "./pages/Analytics/AnalObsItem";

function App() {
  const [authed, setAuthed] = useState(false);

  const [userData, setUserData] = useState({});

  const [pinSidebar, setPinSidebar] = useState(false);
  const dispatch = useDispatch();

  function togglePinSidebar() {
    if (pinSidebar) {
      setPinSidebar(false);
      document.body.classList.remove("g-sidenav-pinned");
    } else {
      setPinSidebar(true);
      document.body.classList.add("g-sidenav-pinned");
    }
  }

  async function amIAuth() {
    try {
      const res = await StatService.amIAuth();
      if (!res.error) {
        setAuthed(true);
        setUserData(res);
        dispatch({ type: actionTypes.SET_USER, payload: res });
      }
    } catch {
      setAuthed(false);
    }
  }

  async function auth(phone: string, pass: string) {
    try {
      const res = await StatService.auth(phone, pass);
      setToken(res.token);
      setAuthed(true);
      setUserData(res.user);
      dispatch({ type: actionTypes.SET_USER, payload: res.user });
    } catch (e: any) {
      if (e.response.status == 500) {
        toast.error("Ошибка сервера");
      } else {
        if (Array.isArray(e.response.data.message)) {
          toast.error(e.response.data.message[0]);
        } else {
          toast.error(e.response.data.message);
        }
      }
    }
  }

  async function logout() {
    StatService.logout();
    setAuthed(false);
    localStorage.removeItem("jwt");
  }

  async function changeCabinet(id: number) {
    // @ts-ignore
    if (+userData.cid === id) return;

    const res = await StatService.changeCabinet(id);

    if (!res.error) {
      setToken(res.token);
      window.location.reload();
    }
  }

  async function setToken(token: string) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    localStorage.setItem("jwt", token);
  }

  useEffect(() => {
    amIAuth();
  }, []);

  if (authed && userData && userData.hasOwnProperty("id")) {
    return (
      <BrowserRouter key={"" + userData}>
        <div className="Main">
          <SidebarTop logout={logout} changeCabinet={changeCabinet} />
          <main className="main-content position-relative max-height-vh-100 h-100 border-radius-lg mt-6">
            <div className="container-fluid py-4">
              <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/item_settings" element={<OrdersEdit />} />
                <Route path="/needed" element={<OrdersNeeded />} />
                <Route path="/orders/:id" element={<OrderSupplyDetail />} />
                <Route path="/orders" element={<OrderSupplyList />} />
                <Route path="/fullfill/:id" element={<OrderFullFillDetail />} />
                <Route path="/fullfill" element={<OrderFullFillList />} />
                <Route path="/fullfillstock" element={<OrderInOurStock />} />
                <Route path="/inway" element={<OrderInWay />} />
                <Route path="/observable/:id" element={<OrderNew />} />
                <Route path="/observable" element={<Orders />} />
                <Route path="/required" element={<Required />} />
                <Route path="/warehouses/:mp" element={<WarehouseMain />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/stat/salespeed/:mp" element={<StatSaleSpeed />} />
                <Route path="/stat/item/:id" element={<AnalObsItem />} />
                <Route path="/finance/capital" element={<CapitalMain />} />
                <Route path="/finance/liability" element={<CapitalLiability />} />
                <Route path="/finance/asset" element={<CapitalAsset />} />
                <Route path="/sync" element={<SyncStat />} />
              </Routes>
            </div>
          </main>
          <ToastContainer autoClose={3000} position="bottom-right" />
        </div>
      </BrowserRouter>
    );
  } else {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Auth auth={auth} />} />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;

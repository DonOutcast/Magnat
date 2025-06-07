import React, {useState} from 'react';
import ReactInputMask from "react-input-mask";
import {ToastContainer} from "react-toastify";

const Auth = (props: {auth: (phone: string, pass: string) => void}) => {

    const [phone, setPhone] = useState('')
    const [pass, setPass] = useState('')


    const authEnterPress = async (event: any) => {
        if (event.key === "Enter") {
            props.auth(phone, pass)
        }
    }

    return (
        <main className="main-content  mt-0">
            <section>
                <div className="page-header min-vh-100">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0 mx-auto">
                                <div className="card card-plain">
                                    <div className="card-header pb-0 text-start" style={{background: "transparent"}}>
                                        <h4 className="font-weight-bolder">Вход</h4>
                                        <p className="mb-0">Введите номер телефона и пароль <br/>Или воспользуйтесь кодом</p>
                                    </div>
                                    <div className="card-body">
                                        <form role="form">
                                            <div className="mb-3">
                                                <ReactInputMask mask="+7 (999) 999-99-99" type="text" className="form-control form-control-lg"
                                                                placeholder="Номер телефона" value={phone}
                                                                onChange={(e) => setPhone(e.target.value)}
                                                                onKeyPress={(e) => authEnterPress(e)}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <input type="password" className="form-control form-control-lg"
                                                       placeholder="Пароль" value={pass}
                                                       onChange={(e) => setPass(e.target.value)}
                                                       onKeyPress={(e) => authEnterPress(e)}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <button type="button" onClick={() => props.auth(phone, pass)}
                                                        className="btn btn-lg bg-gradient-primary btn-lg w-100 mt-4 mb-0">Войти
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="col-6 d-lg-flex d-none h-100 my-auto pe-0 position-absolute top-0 end-0 text-center justify-content-center flex-column">
                                <div
                                    className="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center">
                                    <img src="/assets/img/shapes/pattern-lines.svg" alt="pattern-lines"
                                         className="position-absolute opacity-4 start-0"/>
                                    <h4 className="mt-5 text-white font-weight-bolder">{ process.env.REACT_APP_TITLE }</h4>
                                    <p className="text-white">Чем более простым кажется продукт, тем больше
                                        усилий, вложил разработчик в него.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <ToastContainer autoClose={3000} position="bottom-right"/>
        </main>
    );
};

export default Auth;
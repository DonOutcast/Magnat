import React, {useState} from 'react';
import Modal from "./UI/Modal";
import PaymentService from "../API/PaymentService";
import {toast} from "react-toastify";

const PaymentAdd = (props) => {
    const types = {
        1: 'Наличные',
        2: 'Терминал (эквайринг)',
        3: 'Перевод на карту',
        4: 'Счет',
        5: 'Бикмухаметов',
        6: 'Рекламный бартер',
        7: 'Дисконт',
        8: 'Сертификат',
        9: 'Депозит'
    }

    async function pay() {
        let paymentData = {
            amount: ToPay,
            type: PayType,
        }
        if (props.orderId === 0) {
            paymentData.comment = PayComment
            paymentData.isSale = IsSale
        } else {
            paymentData.orderId = props.orderId
        }

        if (typeof props.hiddenComment != 'undefined' && props.hiddenComment !== '') {
            paymentData.comment = props.hiddenComment
            paymentData.amount = - Math.abs(ToPay)
        }

        const res = await PaymentService.newPayment(paymentData)

        if (!res.error) {
            props.payed(ToPay)
        }
    }

    const [ToPay, setToPay] = useState(props.toPay)
    const [PayType, setPayType] = useState(1)
    const [PayComment, setPayComment] = useState('')
    const [IsSale, setIsSale] = useState(false)

    return (
        <Modal id="appPayment" title="Новая транзакция" onClose={props.closeModal} show={props.modal}
               footerButtons={<button className="btn bg-gradient-success" type="button" onClick={() => pay()}>Оплатить</button>}>
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">К оплате</label>
                <input type="number" className="form-control" id="exampleFormControlInput1"
                       placeholder="" value={ToPay} onChange={(e) => setToPay(parseInt(e.target.value))}/>
            </div>
            <div className="form-group">
                <label htmlFor="exampleFormControlSelect1">Тип оплаты</label>
                <select className="form-control" id="exampleFormControlSelect1" value={PayType} onChange={(e) => setPayType(parseInt(e.target.value))}>
                    { Object.entries(types).map((t,k) => <option key={k} value={t[0]}>{t[1]}</option>) }
                </select>
            </div>
            {props.orderId === 0 &&
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">Комментарий</label>
                <input type="text" className="form-control" id="exampleFormControlInput1"
                       placeholder="" value={PayComment} onChange={(e) => setPayComment(e.target.value)}/>
            </div>
            }

            {props.orderId === 0 &&
            <div className="form-check">
                <input className="form-check-input" type="checkbox" id="fcustomCheck1"
                       style={{width: "40px", height: "40px"}} checked={IsSale} onChange={(e) => setIsSale(!IsSale)}/>
                <label className="custom-control-label" htmlFor="customCheck1"
                       style={{marginLeft: "13px", marginTop: "13px"}}>Доп продажа</label>
            </div>
            }
        </Modal>
    );
};

export default PaymentAdd;
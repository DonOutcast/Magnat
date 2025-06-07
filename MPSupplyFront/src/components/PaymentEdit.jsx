import React, {useState} from 'react';
import Modal from "./UI/Modal";
import PaymentService from "../API/PaymentService";

const PaymentEdit = (props) => {
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

        const res = await PaymentService.editPayment(props.id, paymentData)

        if (!res.error) {
            props.closeModal()
            props.changed(paymentData)
        }
    }

    const [ToPay, setToPay] = useState(props.toPay)
    const [PayType, setPayType] = useState(props.payType)

    return (
        <Modal id="editPayment" title="Редактирование транзакции" onClose={props.closeModal} show={props.modal}
               footerButtons={<button className="btn bg-gradient-success" type="button" onClick={() => pay()}>Сохранить</button>}>
            <div className="form-group">
                <label htmlFor="exampleFormControlInput1">Сумма</label>
                <input type="number" className="form-control" id="exampleFormControlInput1"
                       placeholder="" value={ToPay} onChange={(e) => setToPay(parseInt(e.target.value))}/>
            </div>
            <div className="form-group">
                <label htmlFor="exampleFormControlSelect1">Тип оплаты</label>
                <select className="form-control" id="exampleFormControlSelect1" value={PayType} onChange={(e) => setPayType(parseInt(e.target.value))}>
                    { Object.entries(types).map((t,k) => <option key={k} value={t[0]}>{t[1]}</option>) }
                </select>
            </div>
        </Modal>
    );
};

export default PaymentEdit;
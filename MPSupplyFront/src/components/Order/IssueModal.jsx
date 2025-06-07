import React, {useState} from 'react';
import ItemRAPI from "../../API/ItemRAPI";
import {toast} from "react-toastify";
import Modal from "../UI/Modal";
import OrderRAPI from "../../API/OrderRAPI";

const IssueModal = (props) => {
    const [IssueCode, setIssueCode] = useState('')

    async function issueItem() {
        let res = ''
        if (typeof props.itemID != 'undefined') {
            res = await ItemRAPI.setIssue(props.itemID, IssueCode)
        } else {
            res = await OrderRAPI.setIssue(props.orderID, IssueCode)
        }
        if (!res.error) {
            if (typeof props.itemID != 'undefined') {
                toast.success('Изделие выдано')
            } else {
                toast.success('Заказ выдан')
            }
            props.successIssue()
            setIssueCode('')
            props.closeModal()
        }
    }

    return (
        <Modal id="issue" title="Выдать товар"  onClose={props.closeModal} show={props.modal} footerButtons={<button className="btn bg-gradient-success" onClick={issueItem}>Выдать</button>}>
            <div className="form-group">
                <label>Код выдачи</label>
                <input type="text" value={IssueCode} onChange={(e) => setIssueCode(e.target.value)} className="form-control"/>
            </div>
        </Modal>
    );
};

export default IssueModal;
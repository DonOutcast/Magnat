import React, {useState} from 'react';
import Modal from "../UI/Modal";
import ReactInputMask from "react-input-mask";
import ClientRAPI from "../../API/ClientRAPI";
import {toast} from "react-toastify";

const ClientCreateModal = (props) => {

    async function addClient()
    {
        const res = await ClientRAPI.addClient(client)
        if (!res.error) {
            props.setClient(res.id)
        }
    }

    const [client, setClient] = useState({
        phone: '',
        last_name: '',
        name: '',
        second_name: ''
    })

    function authEnterPress(event)
    {
        if (event.key === "Enter") {
        }
    }
    return (
        <Modal id="new-client" title="Новый клиент" show={props.modal} onClose={props.closeModal} footerButtons={<button className="btn bg-gradient-success" onClick={addClient}>Создать</button>}>
            <div className="form-group">
                <label>Номер телефона</label>
                <ReactInputMask mask="+7 (999) 999-99-99" type="text" className="form-control form-control-lg"
                    placeholder="Номер телефона" value={client.phone}
                    onChange={(e) => {
                        setClient({...client, phone: e.target.value})
                    }}
                    onKeyPress={(e) => authEnterPress(e)}
                />
            </div>
            <div className="form-group">
                <label>Фамилия</label>
                <input type="text" value={client.last_name} onChange={(e) => setClient({...client, last_name: e.target.value})} className="form-control"/>
            </div>
            <div className="form-group">
                <label>Имя</label>
                <input type="text" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} className="form-control"/>
            </div>
            <div className="form-group">
                <label>Отчество</label>
                <input type="text" value={client.second_name} onChange={(e) => setClient({...client, second_name: e.target.value})} className="form-control"/>
            </div>
        </Modal>
    );
};

export default ClientCreateModal;